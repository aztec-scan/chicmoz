#!/bin/bash


# Create the namespace
kubectl create namespace chicmoz --dry-run=client -o yaml | kubectl apply -f -

# Apply gateway CRDs
kubectl apply -f k8s/local/common/gateway-crds.yaml

if bash "$(dirname "$0")/create_local_secrets.sh"; then
    minikube tunnel --bind-address 127.0.0.1
else
    echo "Error: Failed to create secrets. Minikube tunnel will not be started."
    exit 1
fi
