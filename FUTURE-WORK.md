# Future Work: Native L2 Status and Targeted Catchup

## Remaining operational improvements

- Add alert/canary coverage for native tip health:
  - missing `/l2/tips` response.
    - Add a canary check that calls the public API endpoint and fails if it is
      not reachable, returns non-2xx, or returns a payload that does not match
      the expected tips-health shape. This catches explorer-api routing/storage
      regressions and auth/proxy mistakes before users see stale block status.
  - stale tips.
    - Alert when `stale: true` or `stalenessMs > staleAfterMs` persists for
      more than a short grace window. A single stale response can happen during
      deploys or node restarts; sustained staleness means `aztec-listener` is no
      longer publishing fresh `L2_TIPS_EVENT`s or explorer-api is not consuming
      them.
  - degraded tip boundary state.
    - Alert when `/l2/tips` reports `degraded: true`. This means the latest tip
      boundary block is missing locally or its hash does not match the tip, so
      block `nativeStatus` intentionally falls back to `unknown` until repaired.
  - repeated boundary mismatches.
    - Add a separate higher-signal alert for the same boundary mismatch
      recurring across observations. One mismatch can be a transient catchup
      race; repeated mismatches likely indicate a reorg/corruption/repair gap
      that needs operator attention.
- Persist or otherwise track open gaps so deep historical repair does not rely only on repeated scan-window reconciliation.
  - Today reconciliation can rediscover missing ranges by scanning a recent
    window, but a deep or old gap can fall out of that window and only be found
    again if an operator widens the scan or restarts with special settings. Add
    durable tracking for requested/missing ranges in explorer-api storage (or an
    equivalent persistent queue) with status, first/last seen timestamps,
    request count, and last error. The reconciler should drain this open-gap set
    until fulfilled, not rely solely on repeated fresh scans.
- Track repeated degraded tip-boundary mismatches with counters/timestamps instead of only the latest degraded reason.
  - The current health state only exposes the latest degraded reason. Store or
    emit enough history to distinguish “one bad observation that self-healed”
    from “the same proposed/proven/checkpointed/finalized boundary keeps
    mismatching.” At minimum track bucket, height, expected hash, observed DB
    hash, first seen, last seen, and occurrence count. This feeds the alert
    above and gives operators concrete repair targets.

## Later removal work

Only after production observation and consumer migration:

- Remove legacy public `finalizationStatus` response usage.
  - After consumers have moved to `nativeStatus`, stop including
    `finalizationStatus` in public block/table responses or mark it internal
    only. This should be a deliberate API cleanup because external consumers may
    still parse the field today.
- Drop legacy finalization-status DB objects in a dedicated migration.
  - Remove the old finalization-status table/columns/enums only in a standalone
    migration after the API no longer reads or serves them. Keep this separate
    from product changes so rollback risk is obvious and DB state can be checked
    before/after.
- Remove any remaining old finalization-status compatibility code.
  - Delete compatibility helpers, route/controller names, query keys, comments,
    and dead branches that exist only to support the old finalization-status
    model. The public `/by-status` path can either be removed or replaced with a
    clearly native-status-named endpoint once consumers have migrated.
- Revisit old operator escape hatches once cadenced reconciliation, metrics, alerts, and observation prove the new path is enough:
  - `AZTEC_DISABLE_ETERNAL_CATCHUP`
  - `IGNORE_PROCESSED_HEIGHT`
  - `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`
  - `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT`
  - These environment variables were useful manual recovery tools, but they add
    branching behavior and make production state harder to reason about. Once
    persistent gap tracking plus alerts have proven reliable, decide whether to
    remove them, rename them, or keep only a documented break-glass path with
    explicit operator instructions.
