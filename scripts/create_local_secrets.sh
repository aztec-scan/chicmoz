#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.chicmoz.env"

# Import the get_version function
source "$SCRIPT_DIR/get_version.sh"

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

# Get version using the shared script - always from git
VERSION_STRING=$(get_version)
echo "Using VERSION_STRING: $VERSION_STRING"

cat <<EOL | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: version-config
  namespace: chicmoz
data:
  VERSION_STRING: "$VERSION_STRING"
EOL

if [ $? -eq 0 ]; then
    echo "VERSION CONFIG CREATED OR UPDATED!"
else
    echo "Error: Failed to create version config."
    exit 1
fi
