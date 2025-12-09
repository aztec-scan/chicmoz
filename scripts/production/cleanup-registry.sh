#!/bin/bash

# Enable error reporting
set -e

# Function to delete old tags for a given repository
delete_old_tags() {
    local repo="$1"
    echo "Processing repository: $repo"
    
    # List tags and filter tags, excluding the most recent 5
    # Output format: Tag CompressedSize UpdatedAt(4 fields) ManifestDigest
    # We extract: UpdatedAt(4 fields) Tag Digest, sort by date, skip first 5, then get Tag and Digest
    TAG_DIGEST_PAIRS=$(doctl registry repository list-tags "$repo" --no-header | tail -n +2 | awk '{print $5, $6, $7, $8, $1, $NF}' | sort -r | tail -n +6 | awk '{print $5, $6}') || true
    
    if [ -z "$TAG_DIGEST_PAIRS" ]; then
        echo "No old tags found for repository: $repo"
        return
    fi
    
    # Delete each old tag using its manifest digest
    while IFS=' ' read -r tag digest; do
        echo "Attempting to delete tag: $tag (digest: $digest) from repository: $repo"
        if doctl registry repository delete-manifest "$repo" "$digest" --force; then
            echo "Successfully deleted tag: $tag from repository: $repo"
        else
            echo "Failed to delete tag: $tag from repository: $repo"
        fi
    done <<< "$TAG_DIGEST_PAIRS"
}

# Function to start garbage collection
start_garbage_collection() {
    echo "Starting garbage collection..."
    if doctl registry garbage-collection start --include-untagged-manifests --force; then
        echo "Garbage collection started successfully."
        return 0
    else
        echo "Failed to start garbage collection."
        return 1
    fi
}

# Function to check garbage collection status
check_garbage_collection_status() {
    local status
    status=$(doctl registry garbage-collection get-active --format Status --no-header 2>/dev/null) || true
    if [ -z "$status" ]; then
        echo "no_active_gc"
    else
        echo "$status"
    fi
}

# Function to wait for garbage collection to complete
wait_for_garbage_collection() {
    echo "Checking garbage collection status..."
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        local status
        status=$(check_garbage_collection_status)
        case "$status" in
            "succeeded")
                echo "Garbage collection completed successfully."
                return 0
                ;;
            "failed")
                echo "Garbage collection failed."
                return 1
                ;;
            "no_active_gc")
                echo "No active garbage collection found. It may have completed quickly."
                return 0
                ;;
            *)
                if [ $attempt -eq $max_attempts ]; then
                    echo "Garbage collection is still in progress after maximum attempts. Please check manually."
                    return 1
                fi
                echo "Garbage collection is still in progress. Waiting... (Attempt $attempt/$max_attempts)"
                sleep 30  # Wait for 30 seconds before checking again
                ;;
        esac
        attempt=$((attempt + 1))
    done
}

# List all repositories in the registry
echo "Listing repositories..."
REPOS=$(doctl registry repository list --format Name --no-header | tail -n +2 | awk '{print $1}') || { echo "Failed to list repositories"; exit 1; }

if [ -z "$REPOS" ]; then
    echo "No repositories found in the registry."
    exit 0
fi

# Process each repository
while IFS= read -r repo; do
    delete_old_tags "$repo"
done <<< "$REPOS"

# Start garbage collection
if start_garbage_collection; then
    # Wait for garbage collection to complete
    wait_for_garbage_collection
else
    echo "Skipping garbage collection wait due to start failure."
fi

echo "Cleanup process completed."
