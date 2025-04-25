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

## Table Information

### l2_contract_instance_verified_deployment_arguments

- **Columns**: id, address, publicKeys, deployer, salt, constructor_args
- **Status**: Exists but empty in both testnet and devnet (as of check date)

### l2_contract_instance_deployer_metadata

- **Columns**: id, address, contract_identifier, details, creator_name, creator_contact, app_url, repo_url, uploaded_at, reviewed_at
- **Status**: Exists but empty in both testnet and devnet (as of check date)
