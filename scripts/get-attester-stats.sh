#!/bin/bash

# Script to query attester stats from L1 rollup contract using cast
# Based on the queryStakingStateAndEmitUpdates function

set -e

# Load environment from .chicmoz.env if exists (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.chicmoz.env" ]; then
  source "$SCRIPT_DIR/../.chicmoz.env"
fi

RPC_URL=${TESTNET_AZTEC_L1_HTTP}
ROLLUP_ADDRESS=${ROLLUP_ADDRESS}

if [ -z "$RPC_URL" ]; then
  echo "Error: RPC_URL environment variable must be set"
  echo "Example: export TESTNET_AZTEC_L1_HTTP=http://..."
  exit 1
fi

if [ -z "$ROLLUP_ADDRESS" ]; then
  echo "Error: ROLLUP_ADDRESS environment variable must be set"
  echo "Example: export ROLLUP_ADDRESS=0x..."
  exit 1
fi

#echo "Using RPC: $RPC_URL"
#echo "Rollup contract: $ROLLUP_ADDRESS"
echo

# Check if cast is available
if ! command -v cast &>/dev/null; then
  echo "Error: cast (from Foundry) is not installed"
  echo "Install Foundry: curl -L https://foundry.paradigm.xyz | bash"
  exit 1
fi

# Get active attester count
echo "Getting active attester count..."
COUNT_HEX=$(cast call "$ROLLUP_ADDRESS" "getActiveAttesterCount()" --rpc-url "$RPC_URL")
COUNT=$(cast --to-dec "$COUNT_HEX")

echo "Active attester count: $COUNT"
echo

if [ "$COUNT" -eq 0 ]; then
  echo "No active attesters found."
  exit 0
fi

# Determine index offset (0-based or 1-based)
echo "Determining index offset..."
if cast call "$ROLLUP_ADDRESS" "getAttesterAtIndex(uint256)" 0 --rpc-url "$RPC_URL" &>/dev/null; then
  INDEX_OFFSET=0
  echo "Using 0-based indexing"
else
  INDEX_OFFSET=1
  echo "Using 1-based indexing"
fi

# Limit the number of attesters to fetch (to avoid too much output)
LIMIT=${ATTESTER_LIMIT:-3}
if [ "$COUNT" -gt "$LIMIT" ]; then
  echo "Limiting to first $LIMIT attesters (total: $COUNT)"
  COUNT=$LIMIT
fi

echo
echo "Fetching attester data..."

# Function to parse attester view hex into human readable format
parse_attester_view() {
  local hex=$1
  # Remove 0x prefix
  hex=${hex#0x}

  # Extract 32-byte (64 hex char) fields
  status_hex=${hex:0:64}
  balance_hex=${hex:64:64}
  withdrawal_id_hex=${hex:128:64}
  exit_amount_hex=${hex:192:64}
  exitable_at_hex=${hex:256:64}
  recipient_hex=${hex:320:64}
  is_recipient_hex=${hex:384:64}
  exists_hex=${hex:448:64}
  pubkey_x_hex=${hex:512:64}
  pubkey_y_hex=${hex:576:64}
  withdrawer_hex=${hex:640:64}

  # Convert to readable values
  status=$(cast --to-dec "0x$status_hex")
  balance=$(cast --to-dec "0x$balance_hex")
  withdrawal_id=$(cast --to-dec "0x$withdrawal_id_hex")
  exit_amount=$(cast --to-dec "0x$exit_amount_hex")
  exitable_at=$(cast --to-dec "0x$exitable_at_hex")
  recipient="0x${recipient_hex: -40}"
  is_recipient=$([ "$is_recipient_hex" != "0000000000000000000000000000000000000000000000000000000000000000" ] && echo "true" || echo "false")
  exists=$([ "$exists_hex" != "0000000000000000000000000000000000000000000000000000000000000000" ] && echo "true" || echo "false")
  pubkey_x=$(cast --to-dec "0x$pubkey_x_hex")
  pubkey_y=$(cast --to-dec "0x$pubkey_y_hex")
  withdrawer="0x${withdrawer_hex: -40}"

  # Convert status to text
  case $status in
  0) status_text="Inactive" ;;
  1) status_text="Active" ;;
  2) status_text="Exiting" ;;
  3) status_text="Exited" ;;
  *) status_text="Unknown ($status)" ;;
  esac

  # Format output
  cat <<EOF
Status: $status ($status_text)
Effective Balance: $balance wei
Exit:
  Withdrawal ID: $withdrawal_id
  Amount: $exit_amount wei
  Exitable At: $exitable_at
  Recipient/Withdrawer: $recipient
  Is Recipient: $is_recipient
  Exists: $exists
Config:
  Public Key X: $pubkey_x
  Public Key Y: $pubkey_y
  Withdrawer: $withdrawer
EOF
}

# Function to get attester view
get_attester_view() {
  local address=$1
  local result
  result=$(cast call "$ROLLUP_ADDRESS" "getAttesterView(address)" "$address" --rpc-url "$RPC_URL")
  echo "$result"
}

# Fetch attesters
total_stake=0
attesters=()

for ((i = 0; i < COUNT; i++)); do
  contract_index=$((i + INDEX_OFFSET))
  echo -n "Fetching attester $((i + 1))/$COUNT (index $contract_index)... "

  # Get attester address
  addr_result=$(cast call "$ROLLUP_ADDRESS" "getAttesterAtIndex(uint256)" "$contract_index" --rpc-url "$RPC_URL" 2>/dev/null)
  if [ $? -ne 0 ] || [ "$addr_result" = "0x" ] || [ -z "$addr_result" ]; then
    echo "Failed to get address for index $contract_index"
    continue
  fi

  # Extract address from padded result (last 40 hex chars, positions 27-66)
  address_hex=$(echo "$addr_result" | cut -c 27-66)
  attester_address="0x$address_hex"
  echo "$attester_address"

  # Get attester view
  view_result=$(get_attester_view "$attester_address")
  if [ $? -ne 0 ]; then
    echo "  Failed to get view for $attester_address"
    continue
  fi

  # Parse the view into human readable format
  parsed_view=$(parse_attester_view "$view_result")

  # Extract balance for total calculation (from the parsed output)
  balance=$(echo "$parsed_view" | grep "Effective Balance:" | sed 's/Effective Balance: \([0-9]*\) wei/\1/')

  # Store attester info
  attesters+=("$attester_address
$parsed_view")

  # Add to total stake
  if [ -n "$balance" ] && [ "$balance" != "0" ]; then
    total_stake=$((total_stake + balance))
  fi
done

echo
echo "Summary:"
echo "- Total attesters fetched: ${#attesters[@]}"
echo "- Total stake: $total_stake"

echo
echo "Attester details:"
for attester in "${attesters[@]}"; do
  echo "$attester"
  echo "---"
done
