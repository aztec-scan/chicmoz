#!/bin/bash
set -e

if [ -z "$NODE_URL" ]; then
  echo "Error: NODE_URL environment variable is not set"
  exit 1
fi

echo "===== INCREMENT PUBLIC COUNTER ====="
echo "node:     $NODE_URL"
echo "contract: explorer-showcase"
echo "account:  accounts:aztecscan-wallet"

aztec-wallet send increment_public \
  --args accounts:aztecscan-wallet \
  --node-url "$NODE_URL" \
  --from accounts:aztecscan-wallet \
  --contract-address explorer-showcase

echo "===== DONE ====="
