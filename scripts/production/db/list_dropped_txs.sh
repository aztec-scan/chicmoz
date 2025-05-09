#!/bin/bash
# List the latest dropped transactions
# Usage: ./list_dropped_txs.sh [environment] [limit]
# Where environment is one of: testnet (...mainnet)
# And limit is the number of transactions to show (default: 100)

# Set environment or default to testnet
ENVIRONMENT=${1:-"testnet"}
# Set limit or default to 100
LIMIT=${2:-"100"}
DB_NAME="explorer_api_${ENVIRONMENT}"

echo "Listing latest ${LIMIT} dropped transactions for ${ENVIRONMENT} environment (database: ${DB_NAME})"
echo "===================================================================="

# Function to run a query and print the results
run_query() {
  local query=$1
  local title=$2
  echo ""
  echo "=== ${title} ==="
  echo ""
  kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d ${DB_NAME} -c \"${query}\""
}

# List dropped transactions
run_query "SELECT tx_hash, reason, previous_state, orphaned_tx_effect_hash, created_at, dropped_at FROM dropped_tx ORDER BY dropped_at DESC LIMIT ${LIMIT};" "Latest ${LIMIT} Dropped Transactions"

# Count dropped transactions by reason
run_query "SELECT reason, COUNT(*) as count FROM dropped_tx GROUP BY reason ORDER BY count DESC;" "Dropped Transactions by Reason"

# Count dropped transactions by previous state
run_query "SELECT previous_state, COUNT(*) as count FROM dropped_tx GROUP BY previous_state ORDER BY count DESC;" "Dropped Transactions by Previous State"

# Count total dropped transactions
run_query "SELECT COUNT(*) FROM dropped_tx;" "Total Dropped Transactions"

echo ""
echo "Script completed."
