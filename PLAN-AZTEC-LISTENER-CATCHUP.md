# Plan: Improve `aztec-listener` Catchup and Missing-Block Recovery

Goal: make `aztec-listener` catch up based on what `explorer-api` actually needs, without adding synchronous Explorer API -> Aztec RPC calls.

The recommended path is a Kafka-based reconciliation loop: `explorer-api` periodically publishes compact missing-block/gap requests, and `aztec-listener` fulfills them by publishing normal `CATCHUP_BLOCK_EVENT`s. This keeps Aztec RPC ownership in `aztec-listener`, keeps service boundaries clean, and avoids relying on eternal catchup as the only safety net.

## Current State

Relevant files:

- `services/aztec-listener/src/svcs/poller/pollers/block_poller/index.ts`
- `services/aztec-listener/src/svcs/database/heights.controller.ts`
- `services/aztec-listener/src/svcs/database/schema.ts`
- `services/aztec-listener/src/events/emitted/index.ts`
- `services/explorer-api/src/events/received/on-block/index.ts`
- `packages/message-registry/src/aztec.ts`

Current behavior:

1. `aztec-listener` stores per-network processed heights in its own DB table `heights`.
2. At startup those values default to `0` if no listener DB state exists.
3. The block poller asks the Aztec node for proposed and proven heights via `getBlockNumber()` / `getProvenBlockNumber()`.
4. It loops from processed height to chain height and publishes either:
   - `NEW_BLOCK_EVENT` for normal live polling, or
   - `CATCHUP_BLOCK_EVENT` during first-run catchup.
5. `explorer-api` consumes both topics with separate consumer groups but stores them through the same block ingestion path.
6. `oneEternalCatchupFetch()` cycles from block `1` through the latest proposed height and republishes one historical proposed block whenever the live poller has nothing else to process.

Current weaknesses:

- Catchup is based on `aztec-listener` DB state, not `explorer-api` DB state.
- If the listener DB says a height was processed but `explorer-api` missed the Kafka event or failed to store the block, the normal poller will not know.
- Eternal catchup eventually repairs missed proposed blocks, but it is slow, noisy, and blind to actual gaps.
- Eternal catchup currently only republishes proposed status, so it is not a complete proven/checkpoint/finalized repair mechanism.
- On large chains, replaying from `0`/`1` is wasteful and can delay live freshness.
- There appears to be a startup wiring bug in `services/aztec-listener/src/svcs/poller/index.ts`: `forceStartFromProposedHeight` is set from `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT` instead of `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`.

## Design Principles

- `aztec-listener` remains the only service that calls Aztec RPC for block bodies.
- `explorer-api` remains the service that knows what the Explorer DB is missing.
- Recovery should be driven by missing ranges, not by full-chain replay.
- Live head following must not be blocked by deep historical repair.
- Recovery events should reuse the existing block ingestion path where possible.
- All communication should use Kafka/BSON through `@chicmoz-pkg/message-bus` and `@chicmoz-pkg/message-registry`.

## Recommendation: Kafka Missing-Block Reconciliation

Add an additive request/response-style flow over Kafka:

1. `explorer-api` computes missing or suspect L2 block ranges from its own DB.
2. `explorer-api` publishes `L2_BLOCK_RANGE_REQUEST_EVENT` on startup and then on a configurable cadence.
3. `aztec-listener` subscribes to that topic and fetches requested blocks from Aztec RPC.
4. `aztec-listener` republishes those blocks as `CATCHUP_BLOCK_EVENT` with optional request metadata.
5. `explorer-api` consumes the catchup blocks through the existing `catchupHandler` and closes the gaps.

This satisfies the “Explorer API signals what blocks are needed” idea while avoiding synchronous RPC between services.

### New Kafka Topics

Add to `packages/message-registry/src/aztec.ts`:

```ts
type L2BlockRangeRequestEvent = {
  requestId: string;
  requestedAt: number;
  reason:
    | "startup"
    | "cadence"
    | "manual"
    | "reorg_repair"
    | "tip_boundary_mismatch";
  ranges: Array<{
    from: number; // inclusive
    to: number; // inclusive
    statusHint?: "proposed" | "proven";
  }>;
  maxBlocks?: number;
};

type L2BlockRangeResponseEvent = {
  requestId: string;
  respondedAt: number;
  fulfilledRanges: Array<{ from: number; to: number }>;
  failedRanges: Array<{ from: number; to: number; reason: string }>;
};
```

Minimum viable implementation can skip `L2_BLOCK_RANGE_RESPONSE_EVENT` and rely on normal `CATCHUP_BLOCK_EVENT`s plus logs. The response topic becomes useful for dashboards/alerts.

Also consider extending `CatchupBlockEvent` with optional metadata:

```ts
type CatchupBlockEvent = NewBlockEvent & {
  requestId?: string;
  catchupReason?: "startup" | "cadence" | "manual" | "eternal" | "reorg_repair";
};
```

Keep this additive so old consumers continue to work.

### Explorer API Gap Detection

`explorer-api` can detect what it needs from its own DB:

- On startup, query the latest non-orphan block height and scan for missing heights up to a safe chain tip.
- On cadence, scan only a bounded window, e.g. last `N` blocks plus any persisted open gaps.
- For deep historical repair, page through ranges in batches rather than scanning the whole table every few seconds.

Gap types:

- Missing height: no non-orphan block for height `n`.
- Duplicate canonical ambiguity: more than one non-orphan block at height `n`.
- Tip boundary mismatch: DB block at a tip height does not match `getL2Tips()` hash stored from `L2_TIPS_EVENT`.
- Status mismatch: block exists but status/native tip metadata is stale.

Initial MVP should only request missing heights. Add duplicate/reorg/status repair after the basic request loop is proven.

### Listener Request Fulfillment

Add a consumer in `aztec-listener`:

- Subscribe with `getConsumerGroupId({ serviceName, networkId, handlerName: "blockRangeRequestHandler" })`.
- Validate range size and total requested blocks.
- Clamp requested upper bounds to the listener's current `getBlockNumber()` / `getProvenBlockNumber()`.
- Fetch blocks using `getBlock(height)`.
- Publish `CATCHUP_BLOCK_EVENT` for each fulfilled block.
- Rate-limit independently from live polling so recovery cannot starve the live head.

Important: keep live polling and range fulfillment separate. A large historical request should not delay `NEW_BLOCK_EVENT` for the head.

## Alternative Designs

### Option A: Explorer API publishes compact inventory snapshots

Instead of explicit requests, `explorer-api` publishes an inventory summary:

```ts
type L2ExplorerInventoryEvent = {
  observedAt: number;
  contiguousHead: number;
  missingRanges: Array<{ from: number; to: number }>;
  latestStoredBlock: number;
};
```

`aztec-listener` consumes this and decides what to replay.

Pros:

- Listener remains in control of replay policy.
- Good fit for cadence/startup status broadcasts.

Cons:

- Less explicit than requests.
- Harder to correlate “request X produced block Y”.

Use this if you want `explorer-api` to signal state, not commands.

### Option B: Listener owns a durable outbox / local block cache

Store fetched block bodies or block hashes in `aztec-listener` DB and replay from that cache on demand.

Pros:

- Avoids repeated Aztec RPC calls for old blocks.
- Makes replay deterministic if Aztec RPC nodes are flaky.

Cons:

- More storage and schema work.
- Still needs a request/inventory signal from `explorer-api`.

This is a good phase 2 if catchup traffic becomes expensive.

### Option C: Rely on Kafka retention and reset Explorer consumer offsets

If Kafka retains all block events long enough, missing data can be repaired by resetting the Explorer consumer group offset.

Pros:

- No new message types.
- Uses Kafka as the event log.

Cons:

- Operationally heavy.
- Replays too much data.
- Not targeted to actual DB gaps.
- Risky for production if used casually.

This should remain an emergency/admin tool, not the main design.

### Option D: Explorer API directly calls Aztec RPC for missing blocks

`explorer-api` could fetch missing blocks itself.

Pros:

- Very direct.

Cons:

- Violates current service boundary.
- Duplicates Aztec RPC pool/error handling.
- Makes API availability depend on Aztec RPC in new ways.

Not recommended.

## Proposed Phases

### Phase 0: Fix small correctness issues

- Fix startup wiring so `forceStartFromProposedHeight` uses `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`.
- Add log fields around catchup reason and current eternal catchup height.
- Keep behavior otherwise unchanged.

### Phase 1: Add request topic and manual request handling

- Add `L2_BLOCK_RANGE_REQUEST_EVENT` type.
- Add an `aztec-listener` consumer that fulfills bounded requests.
- Add a small script or temporary internal entrypoint to publish manual requests for testing.
- Publish blocks as `CATCHUP_BLOCK_EVENT` with optional `requestId` and `catchupReason`.

### Phase 2: Explorer API startup gap request

- On `explorer-api` startup, after DB init and Kafka init, compute missing ranges up to the latest known safe tip.
- Prefer `L2_TIPS_EVENT` stored tips once the L2 tips plan is implemented.
- Before tips exist, use the highest stored block as the upper bound; do not guess far beyond known data.
- Publish one bounded request per startup, with `reason: "startup"`.

### Phase 3: Cadenced reconciliation

- Add an `explorer-api` reconciliation service with a configurable interval, e.g. `L2_BLOCK_RECONCILIATION_INTERVAL_MS`.
- Scan a recent window, e.g. last 1k/10k blocks depending on network size.
- Maintain a DB table of open missing ranges if deep gaps are detected.
- Publish bounded requests with `reason: "cadence"`.

### Phase 4: Replace/deprioritize eternal catchup

- Keep eternal catchup enabled as a low-frequency safety net initially.
- Once request-driven reconciliation is stable, reduce eternal catchup frequency or disable it by default in production.
- Keep a manual “full sweep” mode for disaster recovery.

### Phase 5: Integrate with native tips/reorg repair

- Use stored `getL2Tips()` snapshots to set safe upper bounds and detect tip-boundary mismatches.
- If a tip boundary hash mismatch is detected, request a small window around the mismatch and let existing reorg handling mark old blocks orphaned.
- Add alerts if requested blocks repeatedly fail or if the same range remains missing after multiple cycles.

## Operational Safeguards

- Hard cap blocks per request, e.g. `maxBlocks <= 500` initially.
- Split large ranges into chunks, e.g. 50–100 blocks.
- Separate Bottleneck limiter for request-driven catchup.
- Do not allow a request to fetch above current Aztec node proposed/proven tip.
- Deduplicate in-flight ranges by `networkId + from + to + reason`.
- Drop or shrink obviously invalid requests (`from < 1`, `to < from`, too many ranges).
- Add metrics/logs:
  - requested ranges,
  - fulfilled blocks,
  - failed fetches,
  - request latency,
  - remaining open gaps.

## Testing Plan

- Unit-test Explorer gap detection:
  - no gaps,
  - single missing height,
  - multiple contiguous ranges,
  - upper-bound clamping,
  - max request size splitting.
- Unit-test listener request validation and clamping.
- Integration-test request -> catchup publish -> Explorer store.
- Regression-test duplicate block/reorg behavior in `services/explorer-api/src/events/received/on-block/`.
- Local manual test:
  1. delete or orphan a small local Explorer block range,
  2. publish `L2_BLOCK_RANGE_REQUEST_EVENT`,
  3. verify `CATCHUP_BLOCK_EVENT` is emitted,
  4. verify Explorer DB closes the gap.

## Open Questions

- Should `explorer-api` request proven repair separately from proposed repair, or should native tips make finalization a separate status derivation concern?
- Should request fulfillment publish all blocks to `CATCHUP_BLOCK_EVENT`, or should a new `REPLAY_BLOCK_EVENT` make intent clearer?
- How much Kafka retention do production clusters currently have for block topics?
- Should open gaps be persisted in `explorer-api`, or recomputed each cadence from DB?
- What is the right production cadence/window per network (`mainnet`, `testnet`, `devnet`)?

## Recommended First Implementation Slice

1. Fix the forced-start env var bug.
2. Add `L2_BLOCK_RANGE_REQUEST_EVENT` and optional catchup metadata.
3. Implement bounded manual request handling in `aztec-listener`.
4. Add `explorer-api` startup-only missing-height request for recent ranges.
5. Observe in devnet/testnet before enabling cadenced reconciliation in production.

This gives most of the benefit quickly: Explorer can ask for blocks it knows are missing, listener remains the sole Aztec RPC owner, and eternal catchup can become a fallback instead of the primary repair mechanism.
