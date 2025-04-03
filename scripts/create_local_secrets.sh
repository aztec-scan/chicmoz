#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.chicmoz.env"

# Check if .local.env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: env-file not found at $ENV_FILE"
    echo "Please make sure the env-file exists"
    exit 1
fi

# Create or update the secret
if kubectl create secret generic global --from-env-file="$ENV_FILE" -n chicmoz --dry-run=client -o yaml | kubectl apply -f -; then
    echo "CHICMOZ SECRETS CREATED OR UPDATED!"
else
    exit 1
fi
