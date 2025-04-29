# Dropped Transactions Implementation

## Overview

Add a new table for dropped transactions in the system. Dropped transactions can be:

1. Transactions that were part of a reorg (previously in `txEffect`)
2. Pending transactions that got stale (previously in `tx`)

## Checklist

### Schema and Database Changes

- [x] Create a new zod-schema for `droppedTx` in `packages/types/src/aztec/l2TxEffect.ts`
  - previousState: `pending`, `included` (enum)
  - optional orphaned txEffect.hash as foreign key
  - txHash
  - createdAt
  - droppedAt
- [x] Create a new `dropped_tx` schema definition `services/explorer-api/src/svcs/database/schema/dropped-tx/index.ts` (look at `services/explorer-api/src/svcs/database/schema/l2block/body.ts` for inspiration)
- [x] Add appropriate relations to other tables (txEffect, l2Tx) (look at `services/explorer-api/src/svcs/database/schema/l2block/relations.ts` for inspiration)
- [x] Update database schema exports

### Controller Implementation

`services/explorer-api/src/svcs/database/controllers/dropped-tx/index.ts` (look at `services/explorer-api/src/svcs/database/controllers/l2Tx/index.ts` for inspiration)

- [x] Create a controller for the `dropped_tx` table with:
  - [x] Store method for dropped transactions
  - [x] Get methods to retrieve dropped transactions
  - [x] Query methods by source type (reorg vs. stale)

### Integration with Existing Code

- [x] Modify reorg handling to store txEffects as dropped transactions (`services/explorer-api/src/events/received/on-block/reorg-handler.ts`)
- [x] Modify stale transaction handling to store pending txs as dropped transactions (`services/explorer-api/src/events/received/on-pending-txs.ts`)

### Migration

- [x] Create a database migration for the new table

## Implementation Details

### Database Schema

The new `dropped_tx` table will contain:

- txHash (primary key)
- reason (enum: `reorg`, `stale`)
- previousState: `pending`, `included` (enum)
- optional orphaned txEffect.hash as foreign key
- createdAt
- droppedAt

### Controller Methods

- `storeDroppedTx`: Store a dropped transaction
- `getDroppedTxByHash`: Retrieve a specific dropped transaction
- `getDroppedTxsBySource`: Get transactions by source type
- `getDroppedTxsByReason`: Get transactions by reason
