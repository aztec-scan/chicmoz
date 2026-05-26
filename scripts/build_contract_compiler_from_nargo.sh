#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
DOCKERFILE="$PROJECT_ROOT/services/event-cannon/Dockerfile.compile-contracts"
BUILD_CONTEXT="$PROJECT_ROOT/services/event-cannon"
IMAGE_REPO="${CONTRACT_COMPILER_IMAGE_REPO:-contract-compiler}"

usage() {
    cat <<'EOF'
Usage:
  scripts/build_contract_compiler_from_nargo.sh [--print-only] <path-to-Nargo.toml>

Examples:
  scripts/build_contract_compiler_from_nargo.sh services/event-cannon/src/contract-projects/SimpleLogging/Nargo.toml
  scripts/build_contract_compiler_from_nargo.sh --print-only services/event-cannon/src/contract-projects/SimpleLogging/Nargo.toml
EOF
}

extract_nargo_aztec_version() {
    local nargo_file="$1"
    local inline_version

    inline_version="$(sed -nE 's/^[[:space:]]*aztec[[:space:]]*=[[:space:]]*\{.*tag[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p' "$nargo_file" | head -n 1)"
    if [ -n "$inline_version" ]; then
        printf '%s\n' "$inline_version"
        return 0
    fi

    awk '
        /^\[dependencies\.aztec\]/ { in_section=1; next }
        /^\[/ { if (in_section) exit; in_section=0 }
        in_section {
            if (match($0, /tag[[:space:]]*=[[:space:]]*"([^"]+)"/, arr)) {
                print arr[1]
                exit
            }
        }
    ' "$nargo_file"
}

map_base_aztec_image() {
    local nargo_version="$1"
    local normalized_version="${nargo_version#v}"

    printf 'aztecprotocol/aztec:%s\n' "$normalized_version"
}

print_only=0

if [ "${1:-}" = "--print-only" ]; then
    print_only=1
    shift
fi

if [ "$#" -ne 1 ]; then
    usage >&2
    exit 1
fi

nargo_input="$1"
if [[ "$nargo_input" = /* ]]; then
    nargo_file="$nargo_input"
else
    nargo_file="$PROJECT_ROOT/$nargo_input"
fi

if [ ! -f "$nargo_file" ]; then
    printf 'Nargo.toml not found: %s\n' "$nargo_file" >&2
    exit 1
fi

nargo_aztec_version="$(extract_nargo_aztec_version "$nargo_file")"
if [ -z "$nargo_aztec_version" ]; then
    printf 'Could not determine dependencies.aztec.tag from %s\n' "$nargo_file" >&2
    exit 1
fi

normalized_nargo_aztec_version="${nargo_aztec_version#v}"
base_aztec_image="$(map_base_aztec_image "$nargo_aztec_version")"
compiler_image="$IMAGE_REPO:$normalized_nargo_aztec_version"

if [ "$print_only" -eq 1 ]; then
    printf 'NARGO_AZTEC_VERSION=%s\n' "$nargo_aztec_version"
    printf 'BASE_AZTEC_IMAGE=%s\n' "$base_aztec_image"
    printf 'COMPILER_IMAGE=%s\n' "$compiler_image"
    exit 0
fi

docker build \
    --build-arg BASE_AZTEC_IMAGE="$base_aztec_image" \
    --build-arg NARGO_AZTEC_VERSION="$nargo_aztec_version" \
    -t "$compiler_image" \
    -f "$DOCKERFILE" \
    "$BUILD_CONTEXT"

printf 'Built %s\n' "$compiler_image"
