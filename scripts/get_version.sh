#!/bin/bash

# Function to get version from git
get_version() {
    # Get the script directory and project root
    local SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
    local PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

    # Save current directory
    local CURRENT_DIR="$(pwd)"

    # Change to project root to get correct git info
    cd "$PROJECT_ROOT"

    # Get version from git
    local VERSION=""
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        VERSION=$(git describe --tags 2>/dev/null)
    fi

    # Change back to original directory
    cd "$CURRENT_DIR"

    # Output version or fallback
    if [ -n "$VERSION" ]; then
        echo "$VERSION"
    else
        echo "development-version"
    fi
}

# If script is executed directly (not sourced), print the version
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    get_version
fi
