#!/bin/sh

set -e

export RUST_BACKTRACE="${RUST_BACKTRACE:-1}"

echo "===INPUTS_START==="
echo "GIT_URL=$GIT_URL"
echo "GIT_REF=$GIT_REF"
echo "SUB_PATH=$SUB_PATH"
echo "AZTEC_VERSION=$AZTEC_VERSION"
echo "NARGO_HOME=$NARGO_HOME"
echo "RUST_BACKTRACE=$RUST_BACKTRACE"
echo "===INPUTS_END==="

echo "Cloning repository..."
rm -rf /workspace/repo
git clone "$GIT_URL" /workspace/repo

cd /workspace/repo

if [ -n "$GIT_REF" ]; then
  echo "Checking out git ref: $GIT_REF"
  git checkout "$GIT_REF"
else
  echo "Using default branch"
fi

echo "Resolved HEAD: $(git rev-parse HEAD)"

cd "/workspace/repo/$SUB_PATH"
echo "Compile working directory: $PWD"

PACKAGE_NAME="$(awk -F'"' '/^name[[:space:]]*=[[:space:]]*"/ { print $2; exit }' Nargo.toml 2>/dev/null || true)"
echo "Detected package name before compile: $PACKAGE_NAME"

echo "Compiling contract..."
ARTIFACT_MARKER_FILE="$(mktemp)"
touch "$ARTIFACT_MARKER_FILE"

echo "Running compile command: node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile"
node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile

echo "Discovering compiled artifact..."
CONTRACT_DIR_NAME="$(basename "$PWD")"
echo "Contract directory name: $CONTRACT_DIR_NAME"

ARTIFACT_PATHS="$(find /workspace/repo -type f -path '*/target/*.json' -newer "$ARTIFACT_MARKER_FILE" | sort)"
printf "%s\n" "$ARTIFACT_PATHS" | sed '/^$/d' > /tmp/artifact-paths.txt

if [ ! -s /tmp/artifact-paths.txt ]; then
  echo "No compiled artifact found after compile"
  exit 1
fi

echo "Discovered artifact paths:"
cat /tmp/artifact-paths.txt

SELECTED_ARTIFACT_PATH="$(grep "/target/$CONTRACT_DIR_NAME" /tmp/artifact-paths.txt | head -n 1 || true)"
if [ -z "$SELECTED_ARTIFACT_PATH" ]; then
  SELECTED_ARTIFACT_PATH="$(head -n 1 /tmp/artifact-paths.txt)"
fi

echo "Selected artifact path after first pass: $SELECTED_ARTIFACT_PATH"
echo "Selected artifact transpiled flag after first pass: $(jq -r '.transpiled // "missing"' "$SELECTED_ARTIFACT_PATH" 2>/dev/null || echo unreadable)"

if ! jq -e '.transpiled == true' "$SELECTED_ARTIFACT_PATH" >/dev/null 2>&1; then
  echo "Selected artifact is not transpiled: $SELECTED_ARTIFACT_PATH"

  WORKSPACE_ROOT=""
  SEARCH_DIR="$PWD"
  while [ "$SEARCH_DIR" != "/" ]; do
    if [ -f "$SEARCH_DIR/Nargo.toml" ] && grep -q '^\[workspace\]' "$SEARCH_DIR/Nargo.toml"; then
      WORKSPACE_ROOT="$SEARCH_DIR"
      break
    fi
    if [ "$SEARCH_DIR" = "/workspace/repo" ]; then
      break
    fi
    SEARCH_DIR="$(dirname "$SEARCH_DIR")"
  done

  echo "Workspace root candidate: ${WORKSPACE_ROOT:-"(none)"}"
  echo "Package name candidate: ${PACKAGE_NAME:-"(none)"}"

  if [ -n "$PACKAGE_NAME" ] && [ -n "$WORKSPACE_ROOT" ]; then
    echo "Running fallback compile command: node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile --package $PACKAGE_NAME"
    echo "Recompiling from workspace root ($WORKSPACE_ROOT) with --package $PACKAGE_NAME to force postprocessing..."
    cd "$WORKSPACE_ROOT"
    node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile --package "$PACKAGE_NAME"

    ARTIFACT_PATHS="$(find /workspace/repo -type f -path '*/target/*.json' -newer "$ARTIFACT_MARKER_FILE" | sort)"
    printf "%s\n" "$ARTIFACT_PATHS" | sed '/^$/d' > /tmp/artifact-paths.txt

    if [ ! -s /tmp/artifact-paths.txt ]; then
      echo "No compiled artifact found after workspace compile"
      exit 1
    fi

    echo "Discovered artifact paths after fallback compile:"
    cat /tmp/artifact-paths.txt

    SELECTED_ARTIFACT_PATH="$(grep "/target/$CONTRACT_DIR_NAME" /tmp/artifact-paths.txt | head -n 1 || true)"
    if [ -z "$SELECTED_ARTIFACT_PATH" ]; then
      SELECTED_ARTIFACT_PATH="$(head -n 1 /tmp/artifact-paths.txt)"
    fi

    echo "Selected artifact path after fallback compile: $SELECTED_ARTIFACT_PATH"
    echo "Selected artifact transpiled flag after fallback compile: $(jq -r '.transpiled // "missing"' "$SELECTED_ARTIFACT_PATH" 2>/dev/null || echo unreadable)"
  else
    echo "Skipping fallback compile because package name or workspace root could not be determined"
  fi
fi

if ! jq -e '.transpiled == true' "$SELECTED_ARTIFACT_PATH" >/dev/null 2>&1; then
  echo "Compiled artifact is still not transpiled: $SELECTED_ARTIFACT_PATH"
  exit 1
fi

echo "Success: transpiled artifact found at $SELECTED_ARTIFACT_PATH"
