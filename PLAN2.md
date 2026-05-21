# PLAN2: Cadenced Catchup, Metrics, Limiter, and Deduplication

## Goal

Turn startup-only Explorer-driven catchup into a reliable reconciliation loop that can continuously repair missing Explorer blocks without relying on eternal full-chain replay.

## Scope

- Add cadenced missing-block reconciliation in `explorer-api`.
- Add bounded/open-gap tracking.
- Add request metrics/logs.
- Add listener-side limiter/deduplication for request-driven catchup.
- Add tip-boundary-mismatch repair requests.

## Proposed changes

### Explorer API reconciliation service

- Add a service started from `explorer-api` startup after DB/Kafka init.
- Config:
  - `L2_BLOCK_RECONCILIATION_ENABLED=true`
  - `L2_BLOCK_RECONCILIATION_INTERVAL_MS`
  - `L2_BLOCK_RECONCILIATION_SCAN_WINDOW`
  - `L2_BLOCK_RECONCILIATION_MAX_BLOCKS`
- On each cadence:
  - determine safe upper bound from stored `l2_tips.proposed.number` if available
  - scan a recent bounded window for missing non-orphan heights
  - publish `L2_BLOCK_RANGE_REQUEST_EVENT` with `reason: "cadence"`
- Keep startup reconciliation, but share code with cadence reconciliation.

### Open gap tracking

- Either add a small DB table for open gaps or maintain a conservative recompute-from-DB approach initially.
- If adding DB state, track:
  - `from`, `to`
  - `reason`
  - `firstSeenAt`, `lastRequestedAt`
  - `attemptCount`
  - `lastFailureReason?`
- Avoid scanning the entire historical chain every interval.

### Tip-boundary mismatch repair

- When stored tips are degraded because a boundary block is missing/mismatched, request a small repair window around the boundary.
- Publish with `reason: "tip_boundary_mismatch"`.
- Let existing Explorer block/reorg handling decide canonical/orphan state.

### Listener fulfillment improvements

- Add dedicated limiter/queue for `L2_BLOCK_RANGE_REQUEST_EVENT` handling.
- Deduplicate in-flight requests by `networkId + from + to + reason`.
- Keep hard caps:
  - max ranges per request
  - max blocks per request
  - max request age
  - max range width
- Continue clamping upper bounds to current Aztec node proposed/proven tips.
- Never let historical repair starve live head polling.

### Metrics/logging

Add structured logs/metrics for:

- request created
- request reason
- requested ranges/count
- fulfilled blocks
- failed heights/ranges
- request latency
- skipped stale/invalid requests
- deduped requests
- remaining open gaps

Optional: add `L2_BLOCK_RANGE_RESPONSE_EVENT` if dashboards need explicit response correlation.

## Tests

- Unit-test missing-range detection:
  - no gaps
  - single gap
  - contiguous gaps
  - split ranges
  - upper-bound clamping
  - max-block cap
- Unit-test listener validation/clamping/dedup logic.
- Integration-test request -> catchup event -> Explorer stores block.
- Regression-test that live polling still runs independently of request catchup.

## Out of scope

- Removing eternal catchup.
- Removing env vars.
- Removing legacy finalization status.

## Verification

- focused tests for Explorer gap detection
- focused tests for listener fulfillment
- `yarn build:packages`
- service-level lint/build for `explorer-api` and `aztec-listener`
- devnet/testnet observation before production enablement

## Risk

Medium. This changes background behavior and can increase Aztec RPC/Kafka load if misconfigured. Keep conservative defaults and bounded requests.
