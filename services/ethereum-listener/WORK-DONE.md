# Ethereum Listener Work Done

Date: 2026-05-20

## Implemented

- Redacted Ethereum RPC URLs from service config logs.
- Made finalized event polling non-overlapping.
- Made event height checkpoints atomic and monotonic with upserts.
- Awaited event callbacks before advancing processed heights.
- Fixed catch-up ETA logging when no progress is made.
- Bounded the L1 block timestamp cache and evicts failed lookups.
- Cached earliest Rollup L1 block discovery per network/rollup address.
- Moved live watchers to WebSocket contracts while keeping HTTP finalized polling as the correctness path.
- Replaced broad generic event watching with an allowlist and deduplication.
- Added finalized backfill for allowlisted generic L1 events.
- Made attester snapshots block-consistent and fail closed rather than publishing partial snapshots.
- Added L1 transaction hash/log index fields for proposal/proof/generic events.
- Added explorer-api migration `0023_l1_transaction_hashes.sql`.
- Broadcast L2 finalization updates through websocket and made the UI invalidate block queries on those updates.

## Commits

- `da9823ca` `fix: redact ethereum listener rpc urls`
- `2f28f2c4` `fix: harden ethereum listener event checkpointing`
- `45dbb43b` `perf: bound ethereum listener l1 caches`
- `68d42861` `perf: reduce ethereum listener generic watcher load`
- `a8ff0f53` `fix: make attester snapshots block consistent`
- `b8d4cac8` `feat: store l1 transaction identity for rollup events`
- `52f4eebb` `feat: broadcast l2 finalization websocket updates`

## Still not done

- `getL2Tips()` status migration is intentionally deferred.
- Health checks still need real freshness/lag/watcher/circuit-breaker state.
- `LISTENER_DISABLED`, `LISTEN_FOR_BLOCKS`, and `BLOCK_POLL_INTERVAL_MS` still need cleanup or wiring.
- Finalized polling interval is still hardcoded.
- Attester address reads are still sequential; multicall/bounded parallelism is a future optimization.
- Additional L1 events are currently mostly generic/observational; typed schemas/API/UI for governance and richer lifecycle pages are still future work.
