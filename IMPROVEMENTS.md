# Follow-up Improvements and Refactors

## Safe next steps

1. Add a read-only tips/health API endpoint that returns stored tips, `observedAt`, degraded reason, and staleness.
2. Add cadenced Explorer reconciliation with env-configured interval, recent-window size, and max blocks per request.
3. Add metrics/log fields for range requests: requested count, fulfilled count, failed ranges, request age, latency, and remaining missing blocks.
4. Add tests around `deriveNativeStatus`, `upsertTips`, startup gap detection, and listener range fulfillment.
5. Update public docs/OpenAPI so consumers understand `nativeStatus` is additive and `finalizationStatus` is legacy.

## Refactors to consider

- Move catchup request constants (`STARTUP_SCAN_WINDOW`, `STARTUP_MAX_BLOCKS`, listener default max blocks, max request age) into env-backed config with conservative defaults.
- Split `aztec-listener` request fulfillment into a small service with explicit validation, clamping, fetching, and publishing functions to make it easier to test.
- Add a small bounded work queue or Bottleneck limiter dedicated to request-driven catchup.
- Add range deduplication keyed by `networkId + from + to + reason` to avoid duplicate startup/cadence/manual requests.
- Store repeated degraded tip-boundary mismatches with counters/timestamps instead of only the latest degraded reason.
- Add a UI/network-health surface for tip freshness and degraded mode, not only status badges in block tables.

## Things that can be removed later

Only after production observation and consumer migration:

- Legacy public `finalizationStatus` response usage.
- Legacy finalization-status DB table usage.
- L1-event-driven product status assignment; keep L1 proposal/proof events as metadata.
- Old `L2_BLOCK_FINALIZATION_UPDATE_EVENT` websocket/Kafka fanout once clients derive visible statuses from tips.
- Eternal catchup as a default production behavior; keep a manual full-sweep/disaster-recovery mode if needed.

## Env vars to keep for now

Keep these for now:

- `AZTEC_DISABLE_ETERNAL_CATCHUP`
- `IGNORE_PROCESSED_HEIGHT`
- `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`
- `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT`

They still cover operator recovery and rollback cases that the new startup-only Explorer catchup does not fully replace yet. Revisit removal after cadenced reconciliation, metrics, alerts, and at least one stable production observation window.
