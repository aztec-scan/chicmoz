# Ethereum Listener Suggestions

Date: 2026-05-20

This is a prioritized improvement plan for `services/ethereum-listener`, based on code inspection, sub-agent research, and read-only runtime checks on testnet and mainnet.

> Status note: much of this plan has now been implemented. See `WORK-DONE.md`. Keep this file as the backlog/reference for what remains.

## Current remaining priorities

1. Add real health state: finalized lag, last successful poll, watcher last error/event, attester circuit breaker, and DB height freshness.
2. Clean up unused config: `LISTENER_DISABLED`, `LISTEN_FOR_BLOCKS`, `BLOCK_POLL_INTERVAL_MS`; make finalized poll interval configurable.
3. Continue logging cleanup toward structured fields.
4. Optimize attester reads further with multicall or bounded parallelism if RPC load still matters.
5. Add typed schemas/API/UI for selected L1 lifecycle/governance events currently only visible generically.
6. Re-observe CPU/RAM after deployment before changing resource limits.
7. Defer `getL2Tips()` status migration until the current listener hardening has settled.

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

### 1. Make height updates atomic and monotonic — done

Initial risk: overlapping callbacks or pollers could write stale heights. Implemented with awaited callbacks and monotonic upserts.

Suggested change:

- replace update-then-insert in `src/svcs/database/controllers/heights.ts` with an upsert
- update heights with DB-side max semantics
- include `isFinalized` in the uniqueness model if it is not already guaranteed by schema design
- make structured `onLogs()` callbacks return `Promise<void>` and await them before returning lag/catch-up results

Expected benefit: safer backfill and restart behavior.

### 2. Prevent finalized poll overlap — done

Initial risk: after catch-up, every 10s interval could start another finalized poll even if the previous one was still running. Implemented with an in-flight guard.

Suggested change:

- replace `setInterval` with an async loop that sleeps after completion, or
- add an `isPollingFinalized` guard
- make the interval configurable via env

Expected benefit: lower duplicate RPC pressure and more predictable logs.

### 3. Redact RPC URLs from logs — done

Initial risk: runtime logs could expose provider URLs/tokens. Implemented with redacted config output.

Suggested change:

- never log full `ETHEREUM_HTTP_RPC_URL`, `ETHEREUM_WS_RPC_URL`, or `ETHEREUM_ALCHEMY_HTTP_URL`
- if useful, log only protocol + hostname/provider class, with query/path/token removed

Expected benefit: lower secret leakage risk in logs and support transcripts.

## Priority 1: Reduce RPC/load and memory pressure

### 4. Split HTTP contracts from WebSocket watcher contracts — done

Initial issue: WebSocket client existed, but contract watchers appeared to be built on the HTTP client. Live watchers now use WS-backed contracts.

Suggested design:

- `getL1Contracts({ transport: "http" })` for historical/finalized `getContractEvents`
- `getL1Contracts({ transport: "ws" })` for live `watchEvent`
- keep HTTP polling as reconciliation, so missed WS events do not break correctness

This directly addresses the earlier experience that WebSockets missed events: do not trust WS as the only source of truth.

### 5. Replace “watch every ABI event” with an allowlist — done

Initial issue: the service started generic watchers for every event on Rollup/Registry/Inbox/Outbox/FeeJuicePortal and also explicit structured watchers for key Rollup events. It now uses an allowlist and excludes structured events from generic watching.

Suggested change:

- define an event allowlist per contract
- exclude `CheckpointProposed` and `L2ProofVerified` from generic watchers if structured watchers are active
- keep a low-priority generic discovery mode only behind config if it is still useful

Expected benefit: fewer subscriptions/polls, less memory, less Kafka noise.

### 6. Bound the block timestamp cache — done

Initial issue: `cached-block-timestamps.ts` stored promises forever and also cached rejected promises. It is now bounded and evicts rejected lookups.

Suggested change:

- use a small LRU or TTL map
- delete cache entries on rejection
- optionally prefetch a block timestamp once per log block in each event batch

Expected benefit: lower long-run memory growth and better recovery after transient RPC failures.

### 7. Cache earliest rollup block discovery — done

Initial issue: earliest-rollup discovery could perform repeated binary searches over finalized L1 blocks. It is now cached per network/rollup address.

Suggested change:

- cache by `(l2NetworkId, rollupAddress)`
- persist in DB metadata after first discovery
- prefer known deployment metadata where available

Expected benefit: less startup/backfill RPC load.

## Priority 2: Improve validator indexing

### 8. Make attester snapshots block-consistent — done

Initial issue: count was read at finalized height, but address/view reads were not all pinned to the same block. Count, address, and view reads are now block-pinned.

Suggested change:

- pass `blockNumber: latestHeight` to `getAttesterAtIndex` and `getAttesterView`
- cache the 0/1-based index offset per rollup address
- use bounded concurrency or multicall for address reads

Expected benefit: fewer inconsistent snapshots and faster polling.

### 9. Make expected `GSE__OutOfBounds` quiet — done by avoiding probing

Initial issue: expected end-of-list probing logged warnings every ~15 minutes. The poller now avoids intentional probing past `getActiveAttesterCount()`.

Suggested change:

- avoid probing past `getActiveAttesterCount()` where possible
- when probing is intentional, log it at info/debug with concise fields

Expected benefit: less noisy logs and better signal for real warnings.

## Priority 3: Expand valuable L1 indexing

### 10. Add structured L1 tx hashes to proposal/proof events — done

Initial gap: structured `CheckpointProposed` and `L2ProofVerified` payloads included L1 block hash/number/timestamp but not `transactionHash`. Transaction hashes are now emitted and stored.

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

### 15. Improve catch-up logging — partially done

Initial issue: catch-up could log `Infinity hrs`. Zero-progress loops now skip ETA; fuller structured logging is still open.

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
