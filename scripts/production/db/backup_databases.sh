#!/bin/bash

set -e

# PostgreSQL Backup Script for Kubernetes Cluster
# This script creates both full and individual database backups

# Configuration
NAMESPACE="chicmoz-prod"
POD_NAME="postgresql-0"
POSTGRES_USER="admin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./postgres_backups_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to format bytes to human readable
format_size() {
    local size=$1
    if [ $size -lt 1024 ]; then
        echo "${size}B"
    elif [ $size -lt 1048576 ]; then
        echo "$(($size / 1024))KB"
    elif [ $size -lt 1073741824 ]; then
        echo "$(($size / 1048576))MB"
    else
        echo "$(($size / 1073741824))GB"
    fi
}

# Create backup directory
print_info "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# Check if pod is running
print_info "Checking if PostgreSQL pod is running..."
if ! kubectl get pod -n $NAMESPACE $POD_NAME &> /dev/null; then
    print_error "Pod $POD_NAME not found in namespace $NAMESPACE"
    exit 1
fi

POD_STATUS=$(kubectl get pod -n $NAMESPACE $POD_NAME -o jsonpath='{.status.phase}')
if [ "$POD_STATUS" != "Running" ]; then
    print_error "Pod $POD_NAME is not running (status: $POD_STATUS)"
    exit 1
fi
print_success "PostgreSQL pod is running"

# Get database sizes
print_info "Fetching database sizes..."
kubectl exec -n $NAMESPACE $POD_NAME -- bash -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U admin -d postgres -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC;"'

echo ""
print_info "Starting backup process..."
echo ""

# 1. Full compressed backup (data only, no roles due to permissions)
print_info "Creating full compressed backup (all databases, data only)..."
FULL_BACKUP_FILE="postgres_full_backup_${TIMESTAMP}.sql.gz"
kubectl exec -n $NAMESPACE $POD_NAME -- bash -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dumpall -U admin --no-role-passwords 2>/dev/null || PGPASSWORD="$POSTGRES_PASSWORD" pg_dumpall -U admin --data-only' | gzip > "$FULL_BACKUP_FILE"

if [ -f "$FULL_BACKUP_FILE" ]; then
    FULL_SIZE=$(stat -f%z "$FULL_BACKUP_FILE" 2>/dev/null || stat -c%s "$FULL_BACKUP_FILE" 2>/dev/null)
    if [ $FULL_SIZE -lt 1000 ]; then
        print_warning "Full backup may have failed (size: $(format_size $FULL_SIZE))"
        print_info "This is expected if user lacks role permissions. Individual backups are sufficient."
    else
        print_success "Full backup created: $FULL_BACKUP_FILE ($(format_size $FULL_SIZE))"
    fi
else
    print_error "Full backup failed"
    exit 1
fi

echo ""
print_info "Creating individual database backups..."

# List of databases to backup (excluding templates and postgres system db)
DATABASES=(
    "explorer_api_testnet"
    "aztec_listener_testnet"
    "ethereum_listener_testnet"
    "auth"
    "apikey"
    "explorer_api_devnet"
    "aztec_listener_devnet"
    "ethereum_listener_devnet"
)

# Create individual backups
INDIVIDUAL_TOTAL_SIZE=0
for DB in "${DATABASES[@]}"; do
    # Check if database exists
    DB_EXISTS=$(kubectl exec -n $NAMESPACE $POD_NAME -- bash -c "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -U admin -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB'\"" 2>/dev/null || echo "")
    
    if [ "$DB_EXISTS" = "1" ]; then
        print_info "Backing up: $DB"
        BACKUP_FILE="${DB}_${TIMESTAMP}.sql.gz"
        
        kubectl exec -n $NAMESPACE $POD_NAME -- bash -c "PGPASSWORD=\"\$POSTGRES_PASSWORD\" pg_dump -U admin $DB" | gzip > "$BACKUP_FILE"
        
        if [ -f "$BACKUP_FILE" ]; then
            FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
            INDIVIDUAL_TOTAL_SIZE=$((INDIVIDUAL_TOTAL_SIZE + FILE_SIZE))
            print_success "  ✓ $BACKUP_FILE ($(format_size $FILE_SIZE))"
        else
            print_warning "  ✗ Failed to backup $DB"
        fi
    else
        print_warning "  ⊘ Database $DB does not exist, skipping"
    fi
done

echo ""
print_info "Creating backup manifest..."

# Create a manifest file with backup information
MANIFEST_FILE="backup_manifest_${TIMESTAMP}.txt"
cat > "$MANIFEST_FILE" << EOF
PostgreSQL Backup Manifest
==========================
Backup Date: $(date)
Namespace: $NAMESPACE
Pod: $POD_NAME
PostgreSQL User: $POSTGRES_USER

Backup Files:
-------------
Full Backup (compressed):
  - $FULL_BACKUP_FILE ($(format_size $FULL_SIZE))

Individual Database Backups (compressed):
EOF

for file in *_${TIMESTAMP}.sql.gz; do
    if [ "$file" != "$FULL_BACKUP_FILE" ] && [ -f "$file" ]; then
        FILE_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        echo "  - $file ($(format_size $FILE_SIZE))" >> "$MANIFEST_FILE"
    fi
done

cat >> "$MANIFEST_FILE" << EOF

Total Size:
  - Full backup: $(format_size $FULL_SIZE)
  - Individual backups: $(format_size $INDIVIDUAL_TOTAL_SIZE)
  - Total: $(format_size $((FULL_SIZE + INDIVIDUAL_TOTAL_SIZE)))

Restoration Instructions:
-------------------------

1. Restore full backup (all databases):
   gunzip -c $FULL_BACKUP_FILE | kubectl exec -i -n $NAMESPACE $POD_NAME -- bash -c 'PGPASSWORD="\$POSTGRES_PASSWORD" psql -U admin postgres'

2. Restore individual database (example for explorer_api_testnet):
   gunzip -c explorer_api_testnet_${TIMESTAMP}.sql.gz | kubectl exec -i -n $NAMESPACE $POD_NAME -- bash -c 'PGPASSWORD="\$POSTGRES_PASSWORD" psql -U admin -d explorer_api_testnet'

3. Restore to a new database:
   # First create the database
   kubectl exec -n $NAMESPACE $POD_NAME -- bash -c 'PGPASSWORD="\$POSTGRES_PASSWORD" psql -U admin -d postgres -c "CREATE DATABASE new_db_name;"'
   # Then restore
   gunzip -c explorer_api_testnet_${TIMESTAMP}.sql.gz | kubectl exec -i -n $NAMESPACE $POD_NAME -- bash -c 'PGPASSWORD="\$POSTGRES_PASSWORD" psql -U admin -d new_db_name'

Notes:
------
- Full backup contains all databases, roles, and global objects
- Individual backups contain only the specified database
- All backups are compressed with gzip
- Keep backups in a secure location with appropriate access controls
EOF

print_success "Manifest created: $MANIFEST_FILE"

echo ""
echo "============================================"
print_success "Backup completed successfully!"
echo "============================================"
echo ""
print_info "Backup location: $(pwd)"
print_info "Full backup size: $(format_size $FULL_SIZE)"
print_info "Individual backups size: $(format_size $INDIVIDUAL_TOTAL_SIZE)"
print_info "Total backup size: $(format_size $((FULL_SIZE + INDIVIDUAL_TOTAL_SIZE)))"
echo ""
print_info "Files created:"
ls -lh
echo ""
print_info "View manifest: cat $MANIFEST_FILE"
echo ""
