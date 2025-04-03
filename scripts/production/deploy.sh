#!/bin/bash

set -e

# Get the script directory for relative paths
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PARENT_SCRIPT_DIR="$(dirname "$SCRIPT_DIR")"

# Import the get_version function
source "$PARENT_SCRIPT_DIR/get_version.sh"

# Get version using the shared script - always from git
VERSION_STRING=$(get_version)
echo "Using VERSION_STRING: $VERSION_STRING"

# Export for backward compatibility with build processes
export VERSION_STRING

# Run skaffold with the version information
skaffold run --filename "k8s/production/skaffold.light.yaml" --default-repo=registry.digitalocean.com/aztlan-containers --build-concurrency=0
