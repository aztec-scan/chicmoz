# Kubernetes PostgreSQL Database Commands

This document contains useful commands for connecting to and querying PostgreSQL databases running in a Kubernetes cluster.

## Finding PostgreSQL Pods

```bash
# List all namespaces
kubectl get namespaces

# List pods in the chicmoz-prod namespace
kubectl get pods -n chicmoz-prod
```

## Listing Databases

```bash
# List all databases
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d postgres -c '\l'"
```

## Finding Tables

```bash
# Search for tables with 'contract_instance' in their name in the aztec_listener_devnet database
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d aztec_listener_devnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%contract_instance%';\""

# Search for tables with 'contract_instance' in their name in the aztec_listener_testnet database
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d aztec_listener_testnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%contract_instance%';\""

# Search for tables with 'contract_instance' in their name in the ethereum_listener_devnet database
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d ethereum_listener_devnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%contract_instance%';\""

# Search for tables with 'contract_instance' in their name in the ethereum_listener_testnet database
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d ethereum_listener_testnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%contract_instance%';\""

# Search for contract or L2 related tables in the explorer_api_devnet database
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_devnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%contract%' OR table_name LIKE '%l2%');\""

# Find specific tables in explorer_api_testnet database
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%l2_contract_instance_verified%' OR table_name LIKE '%l2_contract_instance_deployer%');\""

# Find tables related to contract classes or artifacts
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%contract_class%' OR table_name LIKE '%artifact%');\""

# Find tables related to deployment or verification
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%deploy%' OR table_name LIKE '%verif%');\""

# Find tables related to Aztec Scan notes
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%aztec_scan%';\""
```

## Viewing Table Structure

```bash
# View table structure
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"\d table_name;\""

# Example: View structure of l2_contract_class_registered
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"\d l2_contract_class_registered;\""

# Example: View structure of l2_contract_instance_deployed
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"\d l2_contract_instance_deployed;\""
```

## Querying Specific Tables

```bash
# Query the l2_contract_instance_verified_deployment_arguments table in testnet
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT * FROM l2_contract_instance_verified_deployment_arguments;\""

# Query the l2_contract_instance_deployer_metadata table in testnet
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT * FROM l2_contract_instance_deployer_metadata;\""

# Query the l2_contract_instance_verified_deployment_arguments table in devnet
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_devnet -c \"SELECT * FROM l2_contract_instance_verified_deployment_arguments;\""

# Query the l2_contract_instance_deployer_metadata table in devnet
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_devnet -c \"SELECT * FROM l2_contract_instance_deployer_metadata;\""
```

## Contract Class and Deployment Queries

```bash
# Find contract classes with artifactJson
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT contract_class_id, artifact_contract_name FROM l2_contract_class_registered WHERE artifact_json IS NOT NULL;\""

# Count total deployed contracts
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT COUNT(*) FROM l2_contract_instance_deployed;\""

# Count contracts deployed with a specific contract class
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT COUNT(*) FROM l2_contract_instance_deployed WHERE current_contract_class_id = '0x07cec63fc8993153bfd64b5a9005af4e80414788c5d25763474db5f516f97d06';\""

# Get sample of deployed contract addresses for a specific contract class
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT address FROM l2_contract_instance_deployed WHERE current_contract_class_id = '0x07cec63fc8993153bfd64b5a9005af4e80414788c5d25763474db5f516f97d06' LIMIT 5;\""

# View deployers of contracts
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT address, current_contract_class_id, deployer FROM l2_contract_instance_deployed LIMIT 5;\""
```

## AztecScanNotes Queries

```bash
# List all AztecScanNotes
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT * FROM l2_contract_instance_aztec_scan_notes;\""

# Delete all AztecScanNotes (use with caution)
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"DELETE FROM l2_contract_instance_aztec_scan_notes;\""

# Insert AztecScanNotes from constants file (example with proper SQL quoting)
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"
INSERT INTO l2_contract_instance_aztec_scan_notes (address, origin, comment, name)
VALUES
('0x09db977a84f23f5294fd98a94f282bcaeefac30f5d3d546fd2413d8e7784b1ea', 'Aztec Team', 'This is one of the first contracts deployed testing the default token contract in Aztec-packages. The token is called ''SHIPPED''', 'SHIPPED token');\""
```

## Table Information

### l2_contract_instance_verified_deployment_arguments

- **Columns**: id, address, publicKeys, deployer, salt, constructor_args
- **Status**: Exists but empty in both testnet and devnet (as of check date)

### l2_contract_instance_deployer_metadata

- **Columns**: id, address, contract_identifier, details, creator_name, creator_contact, app_url, repo_url, uploaded_at, reviewed_at
- **Status**: Exists but empty in both testnet and devnet (as of check date)

### l2_contract_class_registered

- **Columns**: block_hash, contract_class_id, version, artifact_hash, private_functions_root, packed_bytecode, artifact_json, artifact_contract_name, contract_type
- **Status**: Contains contract classes, some with artifactJson

### l2_contract_instance_deployed

- **Columns**: id, block_hash, address, version, salt, current_contract_class_id, original_contract_class_id, initialization_hash, deployer, masterNullifierPublicKey, masterIncomingViewingPublicKey, masterOutgoingViewingPublicKey, masterTaggingPublicKey
- **Status**: Contains information about deployed contracts

### l2_contract_instance_aztec_scan_notes

- **Columns**: address, origin, comment, related_l1_contract_addresses, uploaded_at, updated_at, name
- **Status**: Contains metadata about contracts for display in Aztec Scan

## Dropped Transactions Queries

```bash
# List the latest 100 dropped transactions
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT tx_hash, reason, previous_state, orphaned_tx_effect_hash, created_at, dropped_at FROM dropped_tx ORDER BY dropped_at DESC LIMIT 100;\""

# Count dropped transactions by reason
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT reason, COUNT(*) as count FROM dropped_tx GROUP BY reason ORDER BY count DESC;\""

# Count dropped transactions by previous state
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT previous_state, COUNT(*) as count FROM dropped_tx GROUP BY previous_state ORDER BY count DESC;\""

# Count total dropped transactions
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT COUNT(*) FROM dropped_tx;\""

# Find dropped transactions with specific reason
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"SELECT * FROM dropped_tx WHERE reason = 'INVALID_STATE_TRANSITION' LIMIT 10;\""

# View structure of dropped_tx table
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d explorer_api_testnet -c \"\d dropped_tx;\""
```

### dropped_tx

- **Columns**: tx_hash (primary key), reason, previous_state, orphaned_tx_effect_hash, created_at, dropped_at
- **Purpose**: Stores information about transactions that were dropped and did not produce a transaction effect
- **Related**: Can be linked to tx_effect table through orphaned_tx_effect_hash when a transaction is dropped due to being orphaned
