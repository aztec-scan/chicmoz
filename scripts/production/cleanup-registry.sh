#!/bin/bash

# Enable error reporting
set -e

KEEP_LATEST_TAGS=5
GC_POLL_INTERVAL_SECONDS=30
GC_MAX_ATTEMPTS=32
REGISTRY_NAME="${REGISTRY_NAME:-aztlan-containers}"

# Function to delete old tags for a given repository.
# Returns 0 when at least one tag was deleted, 1 otherwise.
delete_old_tags() {
  local registry="$1"
  local repo="$2"
  local deleted_any=1

  echo "Processing repository: $repo in registry: $registry"

  local tag_count
  tag_count=$(doctl registry repository list-tags "$repo" --registry "$registry" -o json | jq 'length')

  if [ "$tag_count" -le "$KEEP_LATEST_TAGS" ]; then
    echo "Repository $repo in $registry has $tag_count tag(s). Nothing to delete."
    return 1
  fi

  local old_tags
  old_tags=$(doctl registry repository list-tags "$repo" --registry "$registry" -o json | jq -r 'sort_by(.updated_at) | reverse | .['"$KEEP_LATEST_TAGS"':] | .[].tag')

  if [ -z "$old_tags" ]; then
    echo "No old tags found for repository: $repo in registry: $registry"
    return 1
  fi

  while IFS= read -r tag; do
    [ -z "$tag" ] && continue
    echo "Attempting to delete tag: $tag from repository: $repo in registry: $registry"
    if doctl registry repository delete-tag "$repo" "$tag" --registry "$registry" --force; then
      echo "Successfully deleted tag: $tag from repository: $repo in registry: $registry"
      deleted_any=0
    else
      echo "Failed to delete tag: $tag from repository: $repo in registry: $registry"
    fi
  done <<<"$old_tags"

  return $deleted_any
}

# Function to start garbage collection
start_garbage_collection() {
  local registry="$1"

  echo "Starting garbage collection for registry: $registry"
  if doctl registry garbage-collection start "$registry" --include-untagged-manifests --force; then
    echo "Garbage collection started successfully for registry: $registry"
    return 0
  else
    echo "Failed to start garbage collection for registry: $registry"
    return 1
  fi
}

# Function to check garbage collection status
check_garbage_collection_status() {
  local registry="$1"
  local gc_json

  gc_json=$(doctl registry garbage-collection get-active "$registry" -o json 2>/dev/null) || true
  if [ -z "$gc_json" ] || [ "$gc_json" = "null" ] || [ "$gc_json" = "[]" ]; then
    echo "no_active_gc"
  else
    echo "$gc_json" | jq -r '
      if type == "array" then
        .[0].status? // "no_active_gc"
      elif type == "object" and has("errors") then
        "no_active_gc"
      elif type == "object" then
        .status? // "unknown"
      else
        "unknown"
      end
    '
  fi
}

# Function to wait for garbage collection to complete
wait_for_garbage_collection() {
  local registry="$1"

  echo "Checking garbage collection status for registry: $registry"
  local attempt=1
  while [ $attempt -le $GC_MAX_ATTEMPTS ]; do
    local status
    status=$(check_garbage_collection_status "$registry")
    case "$status" in
    "succeeded")
      echo "Garbage collection completed successfully for registry: $registry"
      return 0
      ;;
    "failed")
      echo "Garbage collection failed for registry: $registry"
      return 1
      ;;
    "cancelled")
      echo "Garbage collection was cancelled for registry: $registry"
      return 1
      ;;
    "no_active_gc")
      echo "No active garbage collection found for registry: $registry. It may have completed quickly."
      return 0
      ;;
    *)
      if [ $attempt -eq $GC_MAX_ATTEMPTS ]; then
        echo "Garbage collection is still in progress for registry: $registry after $((GC_POLL_INTERVAL_SECONDS * GC_MAX_ATTEMPTS)) seconds. Please check manually."
        return 1
      fi
      echo "Garbage collection status for registry $registry is '$status'. Waiting... (Attempt $attempt/$GC_MAX_ATTEMPTS)"
      sleep "$GC_POLL_INTERVAL_SECONDS"
      ;;
    esac
    attempt=$((attempt + 1))
  done
}

cleanup_registry() {
  local registry="$1"
  local repos
  local deleted_any=1

  echo "Listing repositories for registry: $registry"
  repos=$(doctl registry repository list --registry "$registry" -o json | jq -r '.[].name') || {
    echo "Failed to list repositories for registry: $registry"
    return 1
  }

  if [ -z "$repos" ]; then
    echo "No repositories found in registry: $registry"
    return 0
  fi

  while IFS= read -r repo; do
    [ -z "$repo" ] && continue
    if delete_old_tags "$registry" "$repo"; then
      deleted_any=0
    fi
  done <<<"$repos"

  if [ $deleted_any -ne 0 ]; then
    echo "No tags were deleted in registry: $registry. Skipping garbage collection."
    return 0
  fi

  if start_garbage_collection "$registry"; then
    wait_for_garbage_collection "$registry"
  else
    echo "Skipping garbage collection wait due to start failure for registry: $registry"
    return 1
  fi
}

cleanup_registry "$REGISTRY_NAME"

echo "Cleanup process completed."
