#!/bin/bash
# List manual data in the database including contract classes, verified deployments, and more
# Usage: ./list_manual_data.sh [environment]
# Where environment is one of: testnet, devnet (default: testnet)

# Set environment or default to testnet
ENVIRONMENT=${1:-"testnet"}
DB_NAME="explorer_api_${ENVIRONMENT}"

echo "Listing manual data for ${ENVIRONMENT} environment (database: ${DB_NAME})"
echo "=================================================================="

# Function to run a query and print the results
run_query() {
  local query=$1
  local title=$2
  echo ""
  echo "=== ${title} ==="
  echo ""
  kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d ${DB_NAME} -c \"${query}\""
}

# List contract classes with artifactJson
run_query "SELECT contract_class_id, artifact_contract_name FROM l2_contract_class_registered WHERE artifact_json IS NOT NULL;" "Contract Classes with artifactJson"

# Count contracts for each contract class with artifactJson
run_query "WITH classes AS (SELECT contract_class_id FROM l2_contract_class_registered WHERE artifact_json IS NOT NULL) SELECT c.contract_class_id, COUNT(d.address) FROM classes c LEFT JOIN l2_contract_instance_deployed d ON c.contract_class_id = d.current_contract_class_id GROUP BY c.contract_class_id;" "Contracts deployed per Contract Class with artifactJson"

# List sample of addresses for contract classes with artifactJson
run_query "WITH classes AS (SELECT contract_class_id FROM l2_contract_class_registered WHERE artifact_json IS NOT NULL) SELECT d.current_contract_class_id, d.address FROM l2_contract_instance_deployed d WHERE d.current_contract_class_id IN (SELECT contract_class_id FROM classes) LIMIT 10;" "Sample Addresses using Contract Classes with artifactJson"

# List addresses with verified deployment arguments
run_query "SELECT address, deployer FROM l2_contract_instance_verified_deployment_arguments;" "Addresses with Verified Deployment Arguments"

# List addresses with deployer metadata
run_query "SELECT address, contract_identifier, creator_name FROM l2_contract_instance_deployer_metadata;" "Addresses with Deployer Metadata"

# List AztecScanNotes
run_query "SELECT address, name, origin FROM l2_contract_instance_aztec_scan_notes;" "AztecScanNotes"

# Count total deployed contracts
run_query "SELECT COUNT(*) FROM l2_contract_instance_deployed;" "Total Deployed Contracts"

echo ""
echo "Script completed."
