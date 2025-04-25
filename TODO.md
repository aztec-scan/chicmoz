# Dropped Transactions Implementation

## Overview

Add a new table for dropped transactions in the system. Dropped transactions can be:

1. Transactions that were part of a reorg (previously in `txEffect`)
2. Pending transactions that got stale (previously in `tx`)

## Checklist

### Schema and Database Changes

- [ ] Create a new `droppedTx` schema definition
- [ ] Add appropriate relations to other tables (txEffect, l2Tx)
- [ ] Update database schema exports

### Controller Implementation

- [ ] Create a controller for the `droppedTx` table with:
  - [ ] Store method for dropped transactions
  - [ ] Get methods to retrieve dropped transactions
  - [ ] Query methods by source type (reorg vs. stale)

### Integration with Existing Code

- [ ] Modify reorg handling to store txEffects as dropped transactions
- [ ] Modify stale transaction handling to store pending txs as dropped transactions

### Migration

- [ ] Create a database migration for the new table

## Implementation Details

### Database Schema

The new `droppedTx` table will contain:

- Transaction hash (primary key)
- Source type (txEffect or tx)
- Reason for dropping (reorg or stale)
- Timestamp when dropped
- Original transaction data

### Controller Methods

- `storeDroppedTx`: Store a dropped transaction
- `getDroppedTxByHash`: Retrieve a specific dropped transaction
- `getDroppedTxsBySource`: Get transactions by source type
- `getDroppedTxsByReason`: Get transactions by reason
