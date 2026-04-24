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
  scripts/build_contract_compiler.sh [--push] [--print-only] [<aztec-version> ...]

Examples:
  scripts/build_contract_compiler.sh 4.2.0-aztecnr-rc.2 4.2.0 4.1.3
  scripts/build_contract_compiler.sh --push
  CONTRACT_COMPILER_IMAGE_REPO=registry.digitalocean.com/aztlan-containers/contract-compiler-mainnet scripts/build_contract_compiler.sh --push 4.2.0-aztecnr-rc.2 4.2.0 4.1.3
EOF
}

normalize_version() {
    local version="$1"
    printf '%s\n' "${version#v}"
}

normalize_nargo_dependency_tag() {
    local version="$1"
    if [[ "$version" == v* ]]; then
        printf '%s\n' "$version"
    else
        printf 'v%s\n' "$version"
    fi
}

current_branch() {
    if [ -n "${GITHUB_REF_NAME:-}" ]; then
        printf '%s\n' "$GITHUB_REF_NAME"
        return 0
    fi

    git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD
}

versions_for_branch() {
    local branch="$1"

    case "$branch" in
        production)
            printf '%s\n' 4.2.0-aztecnr-rc.2 4.2.0 4.1.3
            ;;
        production-testnet)
            printf '%s\n' 4.2.0-aztecnr-rc.2 4.2.0 4.1.3
            ;;
        production-devnet)
            printf '%s\n' 4.0.3
            ;;
        *)
            printf 'No default contract-compiler versions configured for branch "%s"\n' "$branch" >&2
            printf 'Pass explicit versions to scripts/build_contract_compiler.sh if needed.\n' >&2
            return 1
            ;;
    esac
}

build_one() {
    local requested_version="$1"
    local normalized_version
    local nargo_dependency_tag
    local base_aztec_image
    local image

    normalized_version="$(normalize_version "$requested_version")"
    nargo_dependency_tag="$(normalize_nargo_dependency_tag "$requested_version")"
    base_aztec_image="aztecprotocol/aztec:${normalized_version}"
    image="${IMAGE_REPO}:${normalized_version}"

    if [ "$PRINT_ONLY" -eq 1 ]; then
        printf 'REQUESTED_AZTEC_VERSION=%s\n' "$requested_version"
        printf 'NORMALIZED_AZTEC_VERSION=%s\n' "$normalized_version"
        printf 'NARGO_AZTEC_VERSION=%s\n' "$nargo_dependency_tag"
        printf 'BASE_AZTEC_IMAGE=%s\n' "$base_aztec_image"
        printf 'COMPILER_IMAGE=%s\n' "$image"
        printf '\n'
        return 0
    fi

    docker build \
        --build-arg BASE_AZTEC_IMAGE="$base_aztec_image" \
        --build-arg NARGO_AZTEC_VERSION="$nargo_dependency_tag" \
        -t "$image" \
        -f "$DOCKERFILE" \
        "$BUILD_CONTEXT"

    printf 'Built %s\n' "$image"

    if [ "$PUSH" -eq 1 ]; then
        docker push "$image"
        printf 'Pushed %s\n' "$image"
    fi
}

PUSH=0
PRINT_ONLY=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --push)
            PUSH=1
            shift
            ;;
        --print-only)
            PRINT_ONLY=1
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

if [ "$#" -eq 0 ]; then
    mapfile -t DEFAULT_VERSIONS < <(versions_for_branch "$(current_branch)")
    set -- "${DEFAULT_VERSIONS[@]}"
fi

for version in "$@"; do
    build_one "$version"
done
