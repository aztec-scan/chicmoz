# Ethereum Listener Suggestions

Date: 2026-05-20

This is a prioritized improvement plan for `services/ethereum-listener`, based on code inspection, sub-agent research, and read-only runtime checks on testnet and mainnet.

## Executive recommendation

Keep the service, but make it a smaller and more factual L1 indexer:

- use WebSockets only for low-latency live hints
- rely on finalized HTTP polling/backfill for correctness
- make height persistence atomic and monotonic
- reduce duplicate/generic watcher load
- stop assigning L2 block status in `ethereum-listener`
- publish/store L1 facts, including transaction hashes
- move block status to Aztec-native `getL2Tips()` states

## Priority 0: Correctness and operational safety

### 1. Make height updates atomic and monotonic

Current risk: overlapping callbacks or pollers can write stale heights. This can cause duplicate work, misleading catch-up state, or in the worst case skipped/replayed event windows.

Suggested change:

- replace update-then-insert in `src/svcs/database/controllers/heights.ts` with an upsert
- update heights with DB-side max semantics
- include `isFinalized` in the uniqueness model if it is not already guaranteed by schema design
- make structured `onLogs()` callbacks return `Promise<void>` and await them before returning lag/catch-up results

Expected benefit: safer backfill and restart behavior.

### 2. Prevent finalized poll overlap

Current risk: after catch-up, every 10s interval can start another finalized poll even if the previous one is still running.

Suggested change:

- replace `setInterval` with an async loop that sleeps after completion, or
- add an `isPollingFinalized` guard
- make the interval configurable via env

Expected benefit: lower duplicate RPC pressure and more predictable logs.

### 3. Redact RPC URLs from logs

Current risk: runtime logs can expose provider URLs/tokens.

Suggested change:

- never log full `ETHEREUM_HTTP_RPC_URL`, `ETHEREUM_WS_RPC_URL`, or `ETHEREUM_ALCHEMY_HTTP_URL`
- if useful, log only protocol + hostname/provider class, with query/path/token removed

Expected benefit: lower secret leakage risk in logs and support transcripts.

## Priority 1: Reduce RPC/load and memory pressure

### 4. Split HTTP contracts from WebSocket watcher contracts

Current issue: WebSocket client exists, but contract watchers appear to be built on the HTTP client.

Suggested design:

- `getL1Contracts({ transport: "http" })` for historical/finalized `getContractEvents`
- `getL1Contracts({ transport: "ws" })` for live `watchEvent`
- keep HTTP polling as reconciliation, so missed WS events do not break correctness

This directly addresses the earlier experience that WebSockets missed events: do not trust WS as the only source of truth.

### 5. Replace “watch every ABI event” with an allowlist

Current issue: the service starts generic watchers for every event on Rollup/Registry/Inbox/Outbox/FeeJuicePortal and also explicit structured watchers for key Rollup events.

Suggested change:

- define an event allowlist per contract
- exclude `CheckpointProposed` and `L2ProofVerified` from generic watchers if structured watchers are active
- keep a low-priority generic discovery mode only behind config if it is still useful

Expected benefit: fewer subscriptions/polls, less memory, less Kafka noise.

### 6. Bound the block timestamp cache

Current issue: `cached-block-timestamps.ts` stores promises forever and also caches rejected promises.

Suggested change:

- use a small LRU or TTL map
- delete cache entries on rejection
- optionally prefetch a block timestamp once per log block in each event batch

Expected benefit: lower long-run memory growth and better recovery after transient RPC failures.

### 7. Cache earliest rollup block discovery

Current issue: earliest-rollup discovery can perform repeated binary searches over finalized L1 blocks.

Suggested change:

- cache by `(l2NetworkId, rollupAddress)`
- persist in DB metadata after first discovery
- prefer known deployment metadata where available

Expected benefit: less startup/backfill RPC load.

## Priority 2: Improve validator indexing

### 8. Make attester snapshots block-consistent

Current issue: count is read at finalized height, but address/view reads are not all pinned to the same block.

Suggested change:

- pass `blockNumber: latestHeight` to `getAttesterAtIndex` and `getAttesterView`
- cache the 0/1-based index offset per rollup address
- use bounded concurrency or multicall for address reads

Expected benefit: fewer inconsistent snapshots and faster polling.

### 9. Make expected `GSE__OutOfBounds` quiet

Current issue: expected end-of-list probing logs warnings every ~15 minutes on both mainnet and testnet.

Suggested change:

- avoid probing past `getActiveAttesterCount()` where possible
- when probing is intentional, log it at info/debug with concise fields

Expected benefit: less noisy logs and better signal for real warnings.

## Priority 3: Expand valuable L1 indexing

### 10. Add structured L1 tx hashes to proposal/proof events

Current gap: structured `CheckpointProposed` and `L2ProofVerified` payloads include L1 block hash/number/timestamp but not `transactionHash`.

Suggested change:

- add `l1TransactionHash` to shared types
- add DB columns in explorer-api proposal/proof tables
- populate from viem log `transactionHash`

Expected benefit: UI/API can link directly to Ethereum transactions and finalization status can stop carrying unrelated semantics.

### 11. Index more high-value Aztec L1 lifecycle events

Suggested order:

1. Rollup finality lifecycle:
   - `CheckpointInvalidated`
   - `PrunedPending`
   - enrich `CheckpointProposed` with `versionedBlobHashes`, `payloadDigest`, `attestationsHash`
2. Validator lifecycle:
   - `ValidatorQueued`
   - `Deposit`
   - `WithdrawInitiated`
   - `WithdrawFinalized`
   - `Slashed`
3. Registry/network changes:
   - `CanonicalRollupUpdated`
4. Governance and signaling:
   - `Proposed`
   - `VoteCast`
   - `ProposalExecuted`
   - `ProposalDropped`
   - `SignalCast`
   - `PayloadSubmittable`
   - `PayloadSubmitted`

Implementation advice:

- keep raw generic event visibility for discovery
- add structured schemas only where the explorer will use the data
- finalized-poll high-value events, not just live-watch them
- add dynamic address discovery for governance/GSE/slasher contracts rather than hardcoding everything

## Priority 4: Simplify L2 finalization/status model

### 12. Move to Aztec-native statuses

Recommended target status:

```ts
type ChicmozL2BlockStatus =
  | "proposed"
  | "checkpointed"
  | "proven"
  | "finalized";
```

Keep `orphaned` as a separate property, not a finalization status.

Derive status from `AztecNode.getL2Tips()`:

- `tips.proposed`
- `tips.checkpointed`
- `tips.proven`
- `tips.finalized`

Then treat `ethereum-listener` output as factual L1 metadata, not block-state authority.

Suggested migration path:

1. Add L1 tx hashes to current proposal/proof events and DB tables.
2. Add `getL2Tips()` polling/storage in `aztec-listener` or `explorer-api`.
3. Publish/store an `L2_TIPS_UPDATED_EVENT` or equivalent.
4. Derive API/UI block status from stored tips.
5. Keep legacy `ChicmozL2BlockFinalizationStatus` mapping for one compatibility window.
6. Remove `isFinalized`-driven status assignment from L1 events.
7. Eventually drop/deprecate the current per-status history table once consumers are migrated.

Expected benefit: simpler semantics, closer alignment with Aztec protocol, and less coupling between L1 listener internals and UI status.

## Priority 5: Observability and config cleanup

### 13. Add useful health state

Current issue: multiple services report `health: () => true`.

Suggested health fields:

- last finalized poll success timestamp
- finalized lag in L1 blocks
- last live watcher event timestamp
- active watcher count
- last watcher error
- attester poll last success/failure
- attester circuit breaker state
- DB height freshness

### 14. Clean config drift

Suggested change:

- either honor or remove `LISTENER_DISABLED`
- either honor or remove `LISTEN_FOR_BLOCKS`
- make finalized polling interval configurable
- review `ATTESTER_*` defaults against observed runtime

### 15. Improve catch-up logging

Current issue: catch-up can log `Infinity hrs`.

Suggested change:

- if no progress was made in a loop, log `progressBlocks=0` and omit ETA
- emit structured fields: `lagBlocks`, `processedBlocks`, `loopDurationMs`, `estimatedRemainingMs`

## Resource recommendation

Do not treat the current 300Mi memory limit as clearly sufficient. The service was healthy but close to the limit on both inspected environments.

Short-term:

- if production OOM risk is a concern, raise the memory limit modestly while code fixes are developed

Medium-term:

- bound caches
- reduce watcher count
- prevent overlapping polls
- then set requests/limits from multi-day p95/p99 usage

CPU looked reasonable in the sampled windows.

## Suggested implementation order

1. Redact logs and fix catch-up `Infinity` ETA.
2. Add finalized poll in-flight guard.
3. Make height writes monotonic/upserted and await callbacks.
4. Bound timestamp cache.
5. Split HTTP vs WS contracts and use WS for live watchers.
6. Replace generic watcher fanout with allowlists.
7. Improve attester polling consistency/noise.
8. Add L1 tx hashes to proposal/proof facts.
9. Add additional structured L1 events by priority.
10. Migrate block status to `getL2Tips()`.
