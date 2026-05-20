# Ethereum Listener Improvement Theses

Date: 2026-05-20

These are evidence-backed hypotheses for improving `services/ethereum-listener`. They are intentionally written as theses to be validated or implemented incrementally.

> Status note: several theses below have since been implemented. See `WORK-DONE.md`. The `getL2Tips()` migration thesis remains intentionally deferred.

## Implementation status

Resolved or mostly resolved:

- T1/T2: live watchers use WebSocket contracts while finalized HTTP polling remains the correctness path.
- T3: generic watchers are allowlisted and structured Rollup events are excluded from generic watching.
- T4/T5: callbacks are awaited, height writes are monotonic upserts, and finalized polling has an in-flight guard.
- T6/T8: earliest Rollup block lookup and block timestamp caches are bounded/cached.
- T7: attester snapshots are block-pinned and fail closed instead of emitting partial snapshots.
- T10: first factual L1 expansion is done via transaction hash/log index storage and selected generic event indexing.
- T12: RPC URL redaction and `Infinity hrs` catch-up logging are fixed.

Still open:

- Real health/lag/watcher/circuit-breaker observability.
- Config cleanup and configurable finalized polling interval.
- More structured logging fields.
- Typed schemas/API/UI for richer L1 lifecycle/governance events.
- T11 / `getL2Tips()` status migration, intentionally postponed.

## T1: The service was using HTTP polling where it intended to use WebSockets — resolved

**Evidence**

- `src/network-client/client/index.ts` creates both WebSocket and HTTP public clients.
- `src/network-client/contracts/index.ts` passes `getPublicHttpClient()` into all typed contract instances.
- `src/network-client/contracts/watch-events.ts` calls `contracts.*.watchEvent.*`, but those contracts were built with the HTTP client.

**Why it matters**

This was true during the initial audit. Live watchers now use WebSocket-backed contracts; finalized polling/backfill remains on HTTP.

**Thesis**

Use WebSocket transport for live watchers, but keep finalized historical backfill on HTTP `getContractEvents`.

**Caveat**

The previous WebSocket attempt reportedly missed events. The safe model is not WS-only. Use:

- WS for low-latency live hints
- finalized HTTP polling/backfill for correctness
- persisted heights for replay after restarts

## T2: WebSockets alone are not enough; correctness should come from replayable finalized polling

**Evidence**

- viem/WebSocket subscriptions can disconnect or miss logs during provider/node/network interruptions.
- Current service already has a finalized polling path for `CheckpointProposed` and `L2ProofVerified`.
- Testnet logs showed large catch-up/backfill behavior working from stored heights.

**Thesis**

The architecture should be explicitly hybrid:

1. WebSocket live watchers publish fast provisional facts.
2. A finalized-polling reconciler publishes or confirms finalized facts.
3. The reconciler is the source of correctness.

This solves the “missed WebSocket events” issue without depending on continuous latest-block polling for everything.

## T3: There were avoidable duplicate event watchers — mostly resolved

**Evidence**

- Initial audit: `watchAllContractsEvents()` started generic watchers for every ABI event on every configured contract, then separately started structured Rollup watchers for `CheckpointProposed` and `L2ProofVerified`.
- Current state: generic events are allowlisted and structured Rollup events are excluded from generic watching.

**Thesis**

Implemented: “watch all ABI events” was replaced with an allowlist and structured Rollup events are excluded.

**Expected benefit**

- less RPC/log subscription load
- less Kafka noise
- easier reasoning about which events are guaranteed structured vs generic
- cleaner resource usage

## T4: Height storage could race or regress — resolved

**Evidence**

- Initial audit: `setHeight()` did update-then-insert, overwrote height directly, and callbacks were not awaited.
- Current state: `setHeight()` uses monotonic upserts and event callbacks are awaited before advancing checkpoints.

**Thesis**

Implemented: height persistence is atomic and monotonic:

- use DB upsert
- update with `greatest(existing_height, new_height)` semantics
- await log processing before marking a chunk complete

**Expected benefit**

- fewer duplicate replays
- lower chance of skipped logs or false catch-up
- safer restart behavior

## T5: The finalized poller could overlap once catchup is complete — resolved

**Evidence**

- Initial audit: after catch-up, every interval could call `getFinalizedContractEvents()` without an in-flight guard.
- Current state: finalized polling has an in-flight guard. The interval is still hardcoded.

**Thesis**

Implemented with an in-flight guard.

## T6: Genesis/earliest-rollup discovery was doing repeated expensive work — mostly resolved

**Evidence**

- Initial audit: `inMemoryHeightTracker()` called `getEarliestRollupBlockNumber()` for each tracker creation and bypassed the partial cache.
- Current state: earliest Rollup L1 block discovery is cached by `(network, rollupAddress)` and prefers known hardcoded genesis blocks.

**Thesis**

Implemented in-memory caching per rollup address/network. Persisting it in DB remains optional future work.

## T7: The attester poller is doing more RPC than necessary and logs expected boundaries as warnings

**Evidence**

- Mainnet and testnet logs show `GSE__OutOfBounds` every ~15 minutes.
- `getAttesterCount()` is block-pinned to finalized height, but address/view reads are not block-pinned to the same height.
- `fetchAttesterAddresses()` reads addresses sequentially inside each batch.

**Thesis**

The attester snapshot should be made quieter and more snapshot-consistent:

- pass the same `blockNumber` into address and view reads
- cache index offset
- use bounded concurrent reads or multicall where feasible
- treat expected end-of-list as info/debug, not warning
- stop probing past `getActiveAttesterCount()` unless needed for a known indexing mismatch

## T8: Memory pressure is real enough to address — initial mitigations done

**Evidence**

- Mainnet usage: ~273Mi of 300Mi.
- Testnet usage: ~283MB of 300Mi.
- No restarts observed, but both were close to limit.
- Initial audit: `cached-block-timestamps.ts` had a module-level unbounded cache of promises and did not evict rejected promises.
- Current state: the timestamp cache is bounded and evicts rejected lookups.

**Thesis**

Before simply increasing limits, remove obvious memory growth vectors:

- bound or TTL the timestamp cache
- reduce watcher count
- remove duplicate subscriptions
- review log payload sizes

Then set memory requests/limits from observed p95/p99 runtime data.

## T9: Health checks are not operationally useful

**Evidence**

Several services return `health: () => true`:

- finalized poller
- attester poller
- event watcher
- network client

**Thesis**

Health should expose whether the service is actually keeping up:

- last successful finalized poll
- finalized block lag
- last watcher event/error
- active watcher count
- attester poller last success/failure and circuit-breaker state
- DB height freshness

## T10: The service should index more Aztec L1 facts, but structured indexing should be selective

**Evidence**

The Aztec v4.2.0 L1 contracts expose additional useful events. Current structured/finalized handling is mostly limited to `CheckpointProposed` and `L2ProofVerified`.

High-value candidates include:

- Rollup finality lifecycle: `CheckpointInvalidated`, `PrunedPending`
- validator lifecycle: `ValidatorQueued`, `Deposit`, `WithdrawInitiated`, `WithdrawFinalized`, `Slashed`
- registry changes: `CanonicalRollupUpdated`
- governance: `Proposed`, `VoteCast`, `ProposalExecuted`, `ProposalDropped`
- governance/slashing signaling: `SignalCast`, `PayloadSubmittable`, `PayloadSubmitted`, slashing proposer events

**Thesis**

Keep generic events for broad discovery, but add structured finalized indexing only where the explorer has semantics or UI/API value.

## T11: `ChicmozL2BlockFinalizationStatus` is mixing concerns and can be simplified

**Evidence**

The six current statuses distinguish:

- L2 node saw proposed/proven
- L1 listener saw proposed/proven
- finalized L1 polling saw proposed/proven

The UI already collapses these into fewer display buckets. Aztec nodes now expose `getL2Tips()` with:

- `proposed`
- `checkpointed`
- `proven`
- `finalized`

**Thesis**

Move toward Aztec-native statuses from `getL2Tips()`. `ethereum-listener` should stop assigning block statuses and should instead publish factual L1 data, especially L1 transaction hashes.

## T12: Logging needs to be more structured and less secret-prone — partially resolved

**Evidence**

- Initial audit: runtime logs exposed raw RPC URLs during initialization, and catch-up logs could print `Infinity hrs`.
- Current state: RPC URLs are redacted in config logs and zero-progress catch-up loops skip ETA.
- Expected attester list boundary checks are warning-level and include large error strings.
- Many messages use emoji prefixes that are readable for humans but poor for automated alerting.

**Thesis**

Introduce structured log fields and redact provider URLs:

- `eventName`
- `contractName`
- `contractAddress`
- `fromBlock`
- `toBlock`
- `lagBlocks`
- `durationMs`
- `networkId`
- sanitized provider host only, never full URL/token
