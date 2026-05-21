# PLAN5: Remove Legacy Finalization Status Path

## Goal

Complete the migration to Aztec-native block status by removing the legacy finalization-status model from product-facing flows.

## Preconditions

- Native tips/status have run through a production observation window.
- API/UI consumers have migrated to `nativeStatus` or tip-derived display.
- Comparison metrics/logs show native status is safe enough to replace legacy display.
- L1 proposal/proof events remain available as metadata.

## Scope

- Remove legacy finalization-status storage/use from Explorer display paths.
- Stop treating L1 rollup events as product-facing status transitions.
- Remove old finalization update Kafka/websocket fanout once clients no longer need it.
- Keep L1 proposal/proof data as factual block metadata.

## Proposed changes

### Explorer API

- Stop deriving display status from `ChicmozL2BlockFinalizationStatus`.
- Keep or migrate response fields carefully:
  - preferred: `nativeStatus`
  - optionally keep deprecated `finalizationStatus` for one more release if external clients need time
- Remove legacy finalization-status DB writes from L1 event handlers.
- Keep L1 event tables/relations for:
  - proposed tx hash/block hash/timestamp
  - proof verified tx hash/block hash/timestamp
  - prover/archive metadata

### Kafka/websocket

- Remove `L2_BLOCK_FINALIZATION_UPDATE_EVENT` publisher/subscriber path after clients use tips/native status.
- Keep `L2_TIPS_EVENT` as the status-update broadcast primitive.
- Prefer UI invalidation/status derivation from tip snapshots over per-block historical fanout.

### UI

- Make native status the only displayed status badge source.
- Preserve orphan visual priority over native status.
- Remove legacy badge mapping and legacy status filters.
- Add/keep native filters:
  - `proposed`
  - `checkpointed`
  - `proven`
  - `finalized`
  - `unknown`
  - `orphaned`

### Database/migrations

- Stop reading/writing old finalization-status tables first.
- Only drop legacy DB objects in a final migration after rollback risk is acceptable.
- Consider a two-step approach:
  1. unused in code, table retained
  2. later migration drops table/indexes

### Types

- Remove or deprecate `ChicmozL2BlockFinalizationStatus` from public response types only when SDK/API consumers are ready.
- Keep internal compatibility only if needed for migration.

## Tests

- API tests verify `nativeStatus` exists and legacy status is absent/deprecated as intended.
- UI tests/screenshots for native status badges and orphan priority.
- Regression tests that L1 proposal/proof metadata still appears on block detail pages.
- Websocket tests verify tip updates refresh visible statuses.

## Out of scope

- Removing L1 event ingestion entirely.
- Changing Aztec listener block polling.
- Catchup env cleanup, unless PLAN4 has not already done it.

## Verification

- `yarn build:packages`
- `explorer-api` lint/build/tests
- `explorer-ui` lint/build/tests
- websocket service build/tests
- production canary after deploy: latest blocks, historical blocks, orphaned blocks, L1 metadata, websocket tip updates

## Risk

Medium to high. This is the public compatibility/removal step. Keep rollback easy by separating code-unused and DB-drop phases.
