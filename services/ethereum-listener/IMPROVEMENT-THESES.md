# Ethereum Listener Improvement Theses

Date: 2026-05-20

These are evidence-backed hypotheses for improving `services/ethereum-listener`. They are intentionally written as theses to be validated or implemented incrementally.

## T1: The service is using HTTP polling where it intended to use WebSockets

**Evidence**

- `src/network-client/client/index.ts` creates both WebSocket and HTTP public clients.
- `src/network-client/contracts/index.ts` passes `getPublicHttpClient()` into all typed contract instances.
- `src/network-client/contracts/watch-events.ts` calls `contracts.*.watchEvent.*`, but those contracts were built with the HTTP client.

**Why it matters**

This likely means live watchers are polling over HTTP rather than maintaining real WebSocket subscriptions. That increases HTTP RPC load and undermines the goal of avoiding continuous polling.

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

## T3: There are avoidable duplicate event watchers

**Evidence**

- `watchAllContractsEvents()` starts generic watchers for every ABI event on every configured contract.
- It then separately starts structured Rollup watchers for `CheckpointProposed` and `L2ProofVerified`.
- This means the same Rollup events are watched both generically and structurally.

**Thesis**

Replace “watch all ABI events” with an explicit allowlist and exclude events that have structured handlers.

**Expected benefit**

- less RPC/log subscription load
- less Kafka noise
- easier reasoning about which events are guaranteed structured vs generic
- cleaner resource usage

## T4: Height storage can race or regress

**Evidence**

- `setHeight()` does update-then-insert.
- It overwrites height directly.
- Polling and watching callbacks are async and can overlap.
- Callback `onLogs()` methods fire async work but return `void`, while `get-events.ts` immediately computes lag from the in-memory height.

**Thesis**

Height persistence should be atomic and monotonic:

- use DB upsert
- update with `greatest(existing_height, new_height)` semantics
- await log processing before marking a chunk complete

**Expected benefit**

- fewer duplicate replays
- lower chance of skipped logs or false catch-up
- safer restart behavior

## T5: The finalized poller can overlap once catchup is complete

**Evidence**

- `src/svcs/poller-finalized-events/index.ts` uses `setInterval` every 10s.
- `runCatchup()` has an `isCatchupStarted` guard.
- After catch-up, every interval can call `getFinalizedContractEvents()` without an in-flight guard.

**Thesis**

Use an awaited loop or add `isPollingFinalized` so finalized polling cannot overlap.

## T6: Genesis/earliest-rollup discovery is doing repeated expensive work

**Evidence**

- `inMemoryHeightTracker()` calls `getEarliestRollupBlockNumber()` for each tracker creation.
- `getEarliestRollupBlockNumber()` performs a binary search over finalized L1 blocks using Rollup `getTips`.
- `getHeights()` has a cached earliest-block promise, but the tracker bypasses it.

**Thesis**

Compute earliest rollup L1 block once per rollup address/network and reuse it. Prefer deployment metadata or persisted DB metadata over repeated binary search.

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

## T8: Memory pressure is real enough to address

**Evidence**

- Mainnet usage: ~273Mi of 300Mi.
- Testnet usage: ~283MB of 300Mi.
- No restarts observed, but both were close to limit.
- `cached-block-timestamps.ts` has a module-level unbounded cache of promises and does not evict rejected promises.

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

## T12: Logging needs to be more structured and less secret-prone

**Evidence**

- Runtime logs exposed raw RPC URLs during initialization.
- Catch-up logs can print `Infinity hrs`.
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
