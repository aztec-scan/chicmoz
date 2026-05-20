# Plan: Migrate Block Status to Aztec `getL2Tips()`

Goal: replace the legacy six-state `ChicmozL2BlockFinalizationStatus` display model with Aztec-native chain tips: `proposed`, `checkpointed`, `proven`, and `finalized`.

This is a backward-compatible migration plan. The legacy status path should remain in place until the native tips path has survived a production observation window.

## Current State

The current block-status model mixes three different sources of truth:

1. what the Aztec node sees (`aztec-listener` publishes `NEW_BLOCK_EVENT` / `CATCHUP_BLOCK_EVENT` with `L2_NODE_SEEN_*` statuses),
2. what the Ethereum listener observed on L1 (`L1_L2_BLOCK_PROPOSED_EVENT` / `L1_L2_PROOF_VERIFIED_EVENT` update status in `explorer-api`),
3. what the UI wants to display.

Relevant code today:

- Legacy enum: `packages/types/src/aztec/l2Block.ts` (`ChicmozL2BlockFinalizationStatus`).
- L2 Kafka messages: `packages/message-registry/src/aztec.ts`.
- Aztec listener block poller: `services/aztec-listener/src/svcs/poller/pollers/block_poller/index.ts`.
- Explorer block ingestion: `services/explorer-api/src/events/received/on-block/index.ts`.
- L1 event status updates: `services/explorer-api/src/events/received/on-l1-rollup-contract-events.ts`.
- Status storage: `services/explorer-api/src/svcs/database/schema/l2block/finalization-status.ts`.

Aztec now exposes canonical tips directly via `AztecNode.getL2Tips()`, so Chicmoz should derive product-facing block status from those tips and keep L1 proposal/proof events as factual metadata only.

## Confirmed Aztec SDK Shape

The currently installed Chicmoz dependency is `@aztec/*` `4.2.0` (`package.json` resolutions). In `node_modules/@aztec/stdlib/dest/block/l2_block_source.d.ts`, `L2Tips` is:

```ts
type L2Tips = {
  proposed: { number: BlockNumber; hash: string };
  checkpointed: {
    block: { number: BlockNumber; hash: string };
    checkpoint: { number: CheckpointNumber; hash: string };
  };
  proven: {
    block: { number: BlockNumber; hash: string };
    checkpoint: { number: CheckpointNumber; hash: string };
  };
  finalized: {
    block: { number: BlockNumber; hash: string };
    checkpoint: { number: CheckpointNumber; hash: string };
  };
};
```

Important version notes:

- In Aztec `4.2.0`, the upstream type comment says `finalized` is “not implemented, set to proven for now”. The UI can still expose a native `finalized` bucket, but product copy should not overpromise until the deployed Aztec version implements distinct finalized tips.
- The local `/home/filip/c/z_EXT/aztec-packages` checkout is currently `next` at `v5.0.0-nightly.20260520-2` and includes an additional `proposedCheckpoint` tip. Do not require that field for the v4 Chicmoz rollout. The wrapper may accept and ignore/store it opportunistically for forward compatibility.

## Target Model

- Store latest L2 tips per Chicmoz L2 network:
  - `proposed`: block number + block hash.
  - `checkpointed`: block number + block hash + checkpoint number + checkpoint hash.
  - `proven`: block number + block hash + checkpoint number + checkpoint hash.
  - `finalized`: block number + block hash + checkpoint number + checkpoint hash.
  - optional future field: `proposedCheckpoint`, only if present in the SDK response.
- Derive native block status from stored tips.
- Keep `orphan` / canonicality separate from finalization status.
- Keep L1 proposal/proof tables for tx hashes, block hashes, timestamps, prover IDs, archive roots, etc.
- Stop using `ethereum-listener` as the source of product-facing block-status truth.

## Native Status Semantics

Add a new status type rather than reusing the legacy enum:

```ts
type ChicmozL2NativeBlockStatus =
  | "proposed"
  | "checkpointed"
  | "proven"
  | "finalized"
  | "unknown";
```

Derivation rule for a non-orphan block:

1. Use the highest matching threshold in this order: `finalized`, `proven`, `checkpointed`, `proposed`.
2. A block at height `n` can be treated as at least status `S` if `n <= tips[S].block.number` (or `n <= tips.proposed.number` for `proposed`).
3. Before advancing a whole status bucket, verify the boundary block in the Explorer DB matches the tip hash for that bucket. If the boundary height is missing or has a different non-orphan hash, mark tip freshness as degraded and do not apply that bucket yet.
4. If the block is orphaned, expose `orphan: true` and keep native status separate. The UI should prioritize the orphan visual state over the native status badge.
5. If tips are missing/stale or the block is above `tips.proposed.number`, return `unknown`.

This avoids giving a false “proven/finalized” label to blocks on a branch that the Aztec node no longer considers canonical.

## Data Model

Add an `explorer-api` table such as `l2_tips`:

| Column                                                        | Notes                                         |
| ------------------------------------------------------------- | --------------------------------------------- |
| `networkId`                                                   | primary key, Chicmoz L2 network id            |
| `proposedBlockNumber` / `proposedBlockHash`                   | latest proposed L2 tip                        |
| `checkpointedBlockNumber` / `checkpointedBlockHash`           | block tip for latest checkpointed checkpoint  |
| `checkpointedCheckpointNumber` / `checkpointedCheckpointHash` | checkpoint metadata                           |
| `provenBlockNumber` / `provenBlockHash`                       | block tip for latest proven checkpoint        |
| `provenCheckpointNumber` / `provenCheckpointHash`             | checkpoint metadata                           |
| `finalizedBlockNumber` / `finalizedBlockHash`                 | block tip for finalized checkpoint            |
| `finalizedCheckpointNumber` / `finalizedCheckpointHash`       | checkpoint metadata                           |
| `observedAt`                                                  | listener wall-clock timestamp                 |
| `aztecNodeName` / `aztecNodeVersion`                          | optional, useful when RPC pool nodes disagree |
| `degradedReason`                                              | optional text/enum if hash checks fail        |

Use Drizzle schema + migration in `services/explorer-api/src/svcs/database/schema/`. Do not mutate the existing legacy finalization status table in the first rollout.

## Kafka / Message Registry

Add an additive L2 topic in `packages/message-registry/src/aztec.ts`:

- `L2_TIPS_EVENT` — latest full tip snapshot from `aztec-listener`.

Payload should be compact and stable:

```ts
type L2TipsEvent = {
  tips: ChicmozL2Tips;
  observedAt: number;
  source: {
    rpcNodeName?: string;
    aztecNodeVersion?: string;
  };
};
```

Add the Zod schemas and inferred types in `packages/types` first. Avoid leaking raw RPC URLs; node names are safer than URLs.

## API Surface

Additive fields only during rollout:

- Block detail/list responses: add `nativeStatus` or `l2Status` while retaining `finalizationStatus`.
- Network health endpoint: include latest tips and `observedAt` / staleness.
- Block table filters: add native status buckets without removing legacy filters immediately.

Recommended response shape:

```ts
{
  finalizationStatus: ChicmozL2BlockFinalizationStatus, // legacy
  nativeStatus: "proposed" | "checkpointed" | "proven" | "finalized" | "unknown",
  orphan?: { timestamp: number; hasOrphanedParent: boolean },
}
```

## WebSocket Flow

Additive first:

- `aztec-listener` publishes `L2_TIPS_EVENT` to Kafka.
- `explorer-api` consumes and stores tips.
- `websocket-event-publisher` can subscribe to `L2_TIPS_EVENT` directly and broadcast a new websocket event, or `explorer-api` can publish a derived “native status/tips update” event after DB storage.
- Keep `L2_BLOCK_FINALIZATION_UPDATE_EVENT` until UIs and consumers have migrated.

Prefer broadcasting tip snapshots rather than one websocket event per historical block when a tip advances by many blocks. The UI can derive status locally for visible rows from the latest tip snapshot.

## Rollout Phases

### 1. Add native types and messages

- Add `ChicmozL2Tips`, `ChicmozL2TipBlock`, `ChicmozL2CheckpointTip`, and `ChicmozL2NativeBlockStatus` in `packages/types`.
- Add `L2_TIPS_EVENT` in `packages/message-registry`.
- Keep existing legacy enum and events for compatibility.
- Package verification: `yarn build:packages` and `yarn lint:packages`.

### 2. Publish tips from `aztec-listener`

- Add `getL2Tips()` wrapper in `services/aztec-listener/src/svcs/poller/network-client/index.ts`.
- Add a tips poller, likely near `chain-info-poller.ts`, with a configurable interval.
- Publish `L2_TIPS_EVENT` only when tips change, plus a low-frequency heartbeat if needed for freshness.
- Do not change block ingestion yet.
- Sanitize source metadata. Do not publish raw private RPC URLs.

### 3. Store tips in `explorer-api`

- Add `l2_tips` Drizzle schema + migration.
- Add a Kafka consumer for `L2_TIPS_EVENT` in `services/explorer-api/src/events/received/`.
- Upsert one latest tips row per network.
- Run hash-boundary validation against non-orphan `l2Block` rows and record degraded state rather than lying about status.

### 4. Expose native status in API

- Derive status from stored tips in `get-block.ts` and table controllers.
- Add an additive API field (`nativeStatus` / `l2Status`).
- Keep legacy `finalizationStatus` during rollout.
- Update block table filters to support native status buckets.

### 5. Update websocket flow

- Broadcast native tip/status updates.
- Keep existing `L2_BLOCK_FINALIZATION_UPDATE_EVENT` until consumers migrate.
- Prefer tip snapshot broadcasts over per-block status fanout.

### 6. Update UIs

- Update `explorer-ui` status badges and network-health page.
- Update `explorer-ui-v2` block status mapping if that app is still active.
- Decide product display for `checkpointed`.
- Display `finalized` carefully on v4 because it is currently equivalent to `proven` upstream.
- Prefer native status when present, fallback to legacy during rollout.

### 7. Observe, compare, then remove legacy model

Only after production confidence:

- Add a temporary comparison log/metric: native-derived status vs legacy status for visible/recent blocks.
- Watch for RPC pool disagreement, stale tips, and boundary hash mismatches.
- Remove `ChicmozL2BlockFinalizationStatus` from public API responses only after SDK/UI consumers are migrated.
- Remove legacy finalization-status DB table usage.
- Remove L1-event-driven status assignment; keep L1 events as metadata.
- Remove old websocket/Kafka finalization update path.
- Drop legacy DB objects in a final migration.

## Testing Plan

- Unit-test native status derivation with:
  - empty tips,
  - normal proposed/checkpointed/proven/finalized ranges,
  - orphaned block,
  - missing boundary block,
  - boundary hash mismatch,
  - v4 `finalized === proven` behavior.
- Integration-test `L2_TIPS_EVENT` publication and consumption.
- API test that legacy `finalizationStatus` remains present during rollout.
- UI test/screenshot for status badges and network health.
- Production observation: compare native vs legacy status for at least one deployment window before removing legacy.

## Effort Estimate

- Backward-compatible rollout: **16–22 engineer-days**.
- Riskier coordinated migration: **9–13 engineer-days**.

The estimate is slightly higher than the initial 14–18 days because the plan needs hash-boundary validation, API filter changes, websocket compatibility, and v4/v5 tip-shape handling.

## Main Risks

- Hash-aware derivation is required around reorgs/orphans.
- `checkpointed` needs clear UI/product meaning.
- `finalized` is not distinct from `proven` in installed Aztec `4.2.0`.
- Deployment order matters across shared packages, API, websocket, and UIs.
- Production branches may pin different `@aztec/*` versions; confirm `getL2Tips()` shape on each branch before deploying.
- RPC pool nodes may disagree temporarily; record source and staleness so the UI can degrade gracefully.
- Do not drop legacy status storage until after a production observation window.
