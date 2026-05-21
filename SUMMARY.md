# PR 630 Summary: Native L2 Tips and Targeted Catchup

## What changed

PR 630 moves block-status display toward Aztec-native chain tips and adds a targeted recovery path for missing Explorer blocks.

### Native L2 tips

- Added shared `ChicmozL2Tips`, tip bucket, and `ChicmozL2NativeBlockStatus` types.
- Added the `L2_TIPS_EVENT` Kafka message.
- `aztec-listener` now polls `AztecNode.getL2Tips()` and publishes compact tip snapshots when tips change, with a heartbeat for freshness.
- `explorer-api` consumes and stores the latest tips in `l2_tips`.
- `explorer-api` derives additive `nativeStatus` values for block detail and block table responses while keeping the legacy `finalizationStatus` field.
- `websocket-event-publisher` forwards tip snapshots to clients.
- `explorer-ui` displays native statuses (`proposed`, `checkpointed`, `proven`, `finalized`, `unknown`) when present.

### Missing-block catchup

- Fixed the forced-start wiring so proposed catchup uses `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT` instead of the proven env var.
- Added `L2_BLOCK_RANGE_REQUEST_EVENT` and optional catchup metadata on `CATCHUP_BLOCK_EVENT`.
- `explorer-api` now builds a startup missing-block request from its own DB state.
- `aztec-listener` subscribes to range requests, clamps them to current Aztec node tips, fetches blocks through its existing Aztec RPC ownership boundary, and republishes normal `CATCHUP_BLOCK_EVENT`s.

## How this improves the system

- Block status becomes aligned with Aztec's native source of truth (`getL2Tips()`), rather than being inferred primarily from a mix of L2-node observations and L1 rollup events.
- L1 proposal/proof observations can remain factual metadata instead of driving the product-facing status badge.
- The API and UI gain a forward-compatible status model that can represent `checkpointed` and future distinct `finalized` semantics.
- Missing-block recovery is now driven by what `explorer-api` actually lacks, not only by the `aztec-listener` local processed-height table.
- The recovery flow preserves service boundaries: only `aztec-listener` calls Aztec RPC for block bodies.
- Startup recovery is bounded and targeted, reducing reliance on noisy full-chain replay.
- Tip storage includes boundary validation and a degraded state, so the API prefers `unknown` over presenting stale or unsafe native statuses when tip hashes do not match stored canonical blocks.

## What is still left from the plans

### L2 tips plan

- Add a public/network-health endpoint exposing latest tips, `observedAt`, and staleness/degraded state.
- Add native-status filtering where the API/UI still only expose legacy status-oriented endpoints.
- Add comparison logs/metrics for native-derived status vs legacy finalization status during a production observation window.
- Add focused tests for native-status derivation, boundary-missing and boundary-mismatch behavior, v4 `finalized === proven`, and `L2_TIPS_EVENT` publication/consumption.
- Decide final product copy for `checkpointed` and be explicit that on Aztec v4 `finalized` may equal `proven` upstream.
- After observation and consumer migration, remove the legacy finalization-status path, old status DB usage, old websocket finalization fanout, and L1-event-driven status assignment.

### Catchup plan

- Add cadenced reconciliation, not just startup reconciliation.
- Persist or otherwise track open gaps so deep historical repair does not require repeated broad scans.
- Add response/metrics around requested ranges, fulfilled blocks, failures, latency, and remaining gaps.
- Add in-flight range deduplication and a separate limiter/queue for request-driven catchup so large repairs cannot compete with live head following.
- Add tip-boundary-mismatch repair requests once native tips have been observed in production.
- Add tests for gap detection, range splitting/clamping, request fulfillment, and request-to-catchup-to-store integration.

## Env var removal decision

Do not remove `AZTEC_DISABLE_ETERNAL_CATCHUP`, `IGNORE_PROCESSED_HEIGHT`, `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT`, or `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT` in this PR.

Reasons:

- The new Explorer-driven catchup is currently startup-only; it is not yet a full replacement for all recovery scenarios.
- `AZTEC_DISABLE_ETERNAL_CATCHUP` is still useful as a safety valve while production observes the new targeted reconciliation flow.
- `IGNORE_PROCESSED_HEIGHT` and the forced-start env vars remain operator escape hatches for rebuilding or overriding `aztec-listener` local height state.
- Removing them safely should happen after cadenced reconciliation, metrics/alerts, and a production observation window prove the new catchup path is sufficient.
