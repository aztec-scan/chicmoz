#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
TUNNEL_BIND_ADDRESS="${CHICMOZ_MINIKUBE_TUNNEL_BIND_ADDRESS:-127.0.0.1}"

# Create the namespace
kubectl create namespace chicmoz --dry-run=client -o yaml | kubectl apply -f -

# Apply gateway CRDs
kubectl kustomize "$PROJECT_ROOT/k8s/common/gateway-crds" | kubectl apply -f -

if bash "$(dirname "$0")/create_local_secrets.sh"; then
    if pgrep -u "$(id -u)" -f "minikube tunnel" >/dev/null; then
        echo "Stopping existing minikube tunnel..."
        pkill -u "$(id -u)" -f "minikube tunnel"
        sleep 1
    fi

    minikube tunnel --bind-address "$TUNNEL_BIND_ADDRESS"
else
    echo "Error: Failed to create secrets. Minikube tunnel will not be started."
    exit 1
fi
