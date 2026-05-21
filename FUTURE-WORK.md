# Future Work: Native L2 Status and Targeted Catchup

## Remaining correctness work

- Add focused tests for L2 tips storage and transport:
  - stale/degraded health output.
  - `L2_TIPS_EVENT` publication, consumption, and websocket forwarding.
- Add catchup/reconciliation tests:
  - startup gap detection.
  - cadenced gap detection.
  - range splitting and clamping.
  - listener range fulfillment.
  - request-to-catchup-to-store integration.
  - tip-boundary-mismatch repair requests.

## Remaining product/API cleanup

- Update SDK examples so consumers understand:
  - `nativeStatus` is the product-facing block status.
  - `finalizationStatus` is legacy compatibility data and should not drive UI display.
  - `checkpointed` is a native Aztec L2 tip bucket.
  - on Aztec v4, upstream `finalized` may equal `proven`.
- Add explicit deprecation notes for `finalizationStatus` in SDK docs.

## Remaining operational improvements

- Add alert/canary coverage for native tip health:
  - missing `/l2/tips` response.
  - stale tips.
  - degraded tip boundary state.
  - repeated boundary mismatches.
- Persist or otherwise track open gaps so deep historical repair does not rely only on repeated scan-window reconciliation.
- Track repeated degraded tip-boundary mismatches with counters/timestamps instead of only the latest degraded reason.
- Consider exposing reconciliation metrics in a structured endpoint or Prometheus output:
  - requested range count.
  - fulfilled block count.
  - failed height/range count.
  - request age.
  - fulfillment latency.
  - remaining missing blocks/open gaps.

## Later removal work

Only after production observation and consumer migration:

- Remove legacy public `finalizationStatus` response usage.
- Drop legacy finalization-status DB objects in a dedicated migration.
- Remove any remaining old finalization-status compatibility code.
- Revisit old operator escape hatches once cadenced reconciliation, metrics, alerts, and observation prove the new path is enough:
  - `AZTEC_DISABLE_ETERNAL_CATCHUP`
  - `IGNORE_PROCESSED_HEIGHT`
  - `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`
  - `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT`
