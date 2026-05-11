#!/bin/bash
set -e

if [ -z "$NODE_URL" ]; then
  echo "Error: NODE_URL environment variable is not set"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "===== RUN ALL EXPLORER SHOWCASE INTERACTIONS ====="
echo "node: $NODE_URL"
echo ""

echo "[1/6] increment-public"
bash "$SCRIPT_DIR/increment-public.sh"
echo ""

echo "[2/6] emit-message"
bash "$SCRIPT_DIR/emit-message.sh"
echo ""

echo "[3/6] add-private-balance"
bash "$SCRIPT_DIR/add-private-balance.sh"
echo ""

echo "[4/6] transfer-private"
bash "$SCRIPT_DIR/transfer-private.sh"
echo ""

echo "[5/6] unshield (private -> public)"
bash "$SCRIPT_DIR/unshield.sh"
echo ""

echo "[6/6] shield (public -> private)"
bash "$SCRIPT_DIR/shield.sh"
echo ""

echo "===== ALL INTERACTIONS COMPLETE ====="
