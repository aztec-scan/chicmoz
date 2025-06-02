# PostgreSQL Database Danger Commands

⚠️ **WARNING: The commands in this document are destructive and will permanently delete data. Use with extreme caution, especially in production environments.** ⚠️

This document contains commands for cleaning up PostgreSQL databases in a Kubernetes environment, specifically for removing all content, schemas, and traces of Drizzle ORM.

## Checking Database Contents

### List all databases

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d postgres -c '\l'"
```

### Check for schemas in a database

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT DISTINCT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public');\""
```

### Check for tables in a schema

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = '<schema_name>' ORDER BY table_name;\""
```

### Check for tables in public schema

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;\""
```

### Check for tables containing a specific string

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%<search_string>%';\""
```

### Count tables in a schema

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '<schema_name>';\""
```

## Destructive Operations

### Drop a specific table

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"DROP TABLE IF EXISTS <table_name> CASCADE;\""
```

### Drop a schema and all its contents

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"DROP SCHEMA IF EXISTS <schema_name> CASCADE;\""
```

### Drop all tables in the public schema

```bash
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"
  DO \$\$
  DECLARE
    r RECORD;
  BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
      EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
  END \$\$;
\""
```

## Complete Database Cleanup

The following script can be used to clean up multiple databases at once, removing all tables from the public schema and dropping any drizzle schemas:

```bash
for db in <database1> <database2> <database3> <database4>; do
  echo "===== Cleaning up database: $db ====="

  # Drop all tables in public schema
  kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d $db -c \"
    DO \\\$\\\$
    DECLARE
      r RECORD;
    BEGIN
      -- Drop all tables in public schema
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
      LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END \\\$\\\$;
  \""

  # Drop drizzle schema if it exists
  kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d $db -c \"DROP SCHEMA IF EXISTS drizzle CASCADE;\""

  echo "Database $db cleaned successfully!"
done
```

## Verification After Cleanup

After cleaning up, verify that all tables and schemas have been properly removed:

```bash
# Verify no tables in public schema
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\""

# Verify no drizzle schema
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d <database_name> -c \"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'drizzle';\""
```

## Example: Cleanup of Specific Databases

### Example command for cleaning multiple specific databases:

```bash
for db in aztec_listener_testnet explorer_api_testnet ethereum_listener_testnet auth; do
  echo "===== Cleaning up database: $db ====="

  # Drop all tables in public schema
  kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d $db -c \"
    DO \\\$\\\$
    DECLARE
      r RECORD;
    BEGIN
      -- Drop all tables in public schema
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
      LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END \\\$\\\$;
  \""

  # Drop drizzle schema if it exists
  kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d $db -c \"DROP SCHEMA IF EXISTS drizzle CASCADE;\""

  echo "Database $db cleaned successfully!"
done
```

### Example command for removing specific tables:

```bash
# Drop specific tables by name
kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d aztec_listener_testnet -c \"DROP TABLE IF EXISTS heights CASCADE;\""

kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d ethereum_listener_testnet -c \"DROP TABLE IF EXISTS heights CASCADE; DROP TABLE IF EXISTS \\\"l1ContractAddresses\\\" CASCADE;\""

kubectl exec postgresql-0 -n chicmoz-prod -- bash -c "PGPASSWORD='secret-local-password' psql -U admin -h postgresql -p 5432 -d auth -c \"DROP TABLE IF EXISTS \\\"auth_api-keys\\\" CASCADE;\""
```

## Creating Databases

The following SQL can be used to create databases if they don't already exist:

```sql
SELECT 'CREATE DATABASE aztec_listener_testnet'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aztec_listener_testnet')\gexec

SELECT 'CREATE DATABASE explorer_api_testnet'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'explorer_api_testnet')\gexec

SELECT 'CREATE DATABASE ethereum_listener_testnet'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ethereum_listener_testnet')\gexec

SELECT 'CREATE DATABASE auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth')\gexec
```
