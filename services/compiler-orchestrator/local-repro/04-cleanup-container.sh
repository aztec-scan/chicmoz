#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-compiler-orchestrator-local-repro}"

docker rm -f "$CONTAINER_NAME"
