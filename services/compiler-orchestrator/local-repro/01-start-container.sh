#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
CONTAINER_NAME="${CONTAINER_NAME:-compiler-orchestrator-local-repro}"
COMPILER_IMAGE="${COMPILER_IMAGE:-registry.digitalocean.com/aztlan-containers/contract-compiler-mainnet:v4.2.0-aztecnr-rc.2}"
GIT_URL="${GIT_URL:-https://github.com/defi-wonderland/aztec-standards.git}"
GIT_REF="${GIT_REF:-v4.2.0-aztecnr-rc.2}"
SUB_PATH="${SUB_PATH:-src/token_contract}"
AZTEC_VERSION="${AZTEC_VERSION:-4.2.0-aztecnr-rc.2}"
NARGO_HOME="${NARGO_HOME:-/root/nargo}"

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --network host \
  -e GIT_URL="$GIT_URL" \
  -e GIT_REF="$GIT_REF" \
  -e SUB_PATH="$SUB_PATH" \
  -e AZTEC_VERSION="$AZTEC_VERSION" \
  -e NARGO_HOME="$NARGO_HOME" \
  -v "$SCRIPT_DIR/compile-repro.sh:/usr/local/bin/compile-repro.sh:ro" \
  "$COMPILER_IMAGE" \
  /bin/sh -lc 'chmod +x /usr/local/bin/compile-repro.sh && trap : TERM INT; while true; do sleep 3600; done'

printf 'Started container: %s\n' "$CONTAINER_NAME"
printf 'Mounted script: %s\n' "/usr/local/bin/compile-repro.sh"
