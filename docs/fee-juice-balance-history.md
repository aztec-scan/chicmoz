# Fee Juice Balance History — Research Findings

## Goal

Add a fee-juice balance history view to the **address page** in the explorer UI. The data should cover any address that appears as a fee-payer, initiator, or sender in L2 transactions.

---

## Current Data Flow (What Already Works)

### Ingestion — `aztec-listener`

| File                                                                                      | Line    | Role                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/aztec-listener/src/svcs/poller/pollers/block_poller/index.ts`                   | 165     | Calls `handleProvenTransactions(block)` per proven block                                                                                                  |
| `services/aztec-listener/src/svcs/poller/pollers/block_poller/handle-proven-block-txs.ts` | 46–57   | Reads `feePayer` from each proven tx, calls `getBalanceOf`, publishes Kafka message                                                                       |
| `services/aztec-listener/src/svcs/poller/network-client/index.ts`                         | 222–235 | `getBalanceOf(blockNumber, address)` — reads FeeJuice storage slot 1 via `getPublicStorageAt`. **Accepts any `AztecAddress`**, not coupled to fee-payers. |

**Key insight:** `getBalanceOf` is reusable for any address. The coupling to fee-payer is only in the caller.

### Kafka Message

| File                                     | Key                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/message-registry/src/aztec.ts` | `CONTRACT_INSTANCE_BALANCE_EVENT` → `{ contractAddress, balance, timestamp, sourceTxHash }` |

### Storage — `explorer-api`

| File                                                                                           | Line | Role                                                                                          |
| ---------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| `services/explorer-api/src/events/received/on-contract-instance-balance.ts`                    | 25   | Kafka consumer — calls `storeContractInstanceBalance(event)`                                  |
| `services/explorer-api/src/svcs/database/controllers/contract-instance-balance/store.ts`       | 6    | `INSERT INTO contract_instance_balance ON CONFLICT DO NOTHING`                                |
| `services/explorer-api/src/svcs/database/schema/contract-instance-balance/index.ts`            | 5    | Table: `contract_instance_balance` — PK `(contract_address, timestamp)`                       |
| `services/explorer-api/src/svcs/database/controllers/contract-instance-balance/get-balance.ts` | 63   | `getContractInstanceBalanceHistory(address)` — `SELECT ... ORDER BY timestamp ASC LIMIT 1000` |

### HTTP Endpoint

| File                                                                                         | Line | Role                                                         |
| -------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------ |
| `services/explorer-api/src/svcs/http-server/routes/index.ts`                                 | 277  | Route: `GET /l2/contract-instances/:address/balance/history` |
| `services/explorer-api/src/svcs/http-server/routes/controllers/contract-instance-balance.ts` | 106  | Controller — Redis cache + DB fallback                       |
| `services/explorer-api/src/svcs/http-server/routes/utils/db-wrapper.ts`                      | 41   | Redis cache helper                                           |

---

## Address Sources — Where Addresses Come From

### Addresses captured per transaction

| Address Type                      | Pipeline                         | Table                           | Column             |
| --------------------------------- | -------------------------------- | ------------------------------- | ------------------ |
| `feePayer`                        | Block poller + Pending tx poller | `tx`, `tx_effect`               | `fee_payer`        |
| `initiator`                       | Pending tx poller                | `tx`                            | `initiator`        |
| `msgSender` per public call       | Pending tx poller                | `tx_public_call_request`        | `msg_sender`       |
| `contractAddress` per public call | Pending tx poller                | `tx_public_call_request`        | `contract_address` |
| Deployed contract instances       | Contract events                  | `l2_contract_instance_deployed` | `address`          |

### Relevant files for address extraction

| File                                                                    | Line  | Notes                                                                                   |
| ----------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| `services/aztec-listener/src/events/emitted/on-pending-txs.ts`          | 156   | Extracts `feePayer`, `initiator`, all `msgSender`/`contractAddress` per public call     |
| `packages/backend-utils/src/parse-block.ts`                             | 36–68 | Parses `L2Block` → `ChicmozL2Block`, preserves `feePayer` and `initiator` on tx effects |
| `services/explorer-api/src/svcs/database/schema/l2tx/index.ts`          | 10–45 | `l2Tx` table: `feePayer`, `initiator` columns                                           |
| `services/explorer-api/src/svcs/database/schema/l2public-call/index.ts` | 17    | `tx_public_call_request` table: `msg_sender`, `contract_address` columns                |

### The `/l2/public-call-requests?senderAddress=` endpoint

| File                                                                           | Line    | Notes                                                                                                                 |
| ------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts`    | 48, 155 | Path + `getPublicCallRequestsSchema` (optional `senderAddress` query param)                                           |
| `services/explorer-api/src/svcs/http-server/routes/controllers/public-call.ts` | 120–154 | Controller — dispatches to `getPublicCallRequestsBySenderAddress`                                                     |
| `services/explorer-api/src/svcs/database/controllers/l2Public-call/get.ts`     | 61–71   | `SELECT * FROM tx_public_call_request WHERE msg_sender = :address` — **no DB index on `msg_sender`**, full table scan |

---

## Gaps / What Needs to Be Built

### 1. Balance only captured for fee-payers of proven txs

`handle-proven-block-txs.ts` only iterates `provenTx.feePayer`. To cover the address page for any address (initiator, sender, etc.) we need to either:

- Extend the proven-tx handler to also snapshot `initiator` balances, or
- Add a new on-demand balance fetch triggered when an address is first "seen"

### 2. No aggregate "seen addresses" table

There is no cross-table index of unique addresses. To populate balance history for all address types, a new addresses table or a fan-out in the Kafka publisher would be needed.

### 3. `tx_effect` rows don't populate `feePayer`/`initiator` from on-chain blocks

`services/explorer-api/src/svcs/database/controllers/l2block/store.ts` lines 160–172 — `feePayer` and `initiator` exist in the `tx_effect` schema but are **not set** during block ingestion. Only the pending-tx path populates them.

### 4. Missing DB index on `msg_sender`

`tx_public_call_request.msg_sender` has no index — `/l2/public-call-requests?senderAddress=` does a full table scan.

---

## Proposed Extension Points

### Option A — Minimal (fee-payer only, reuse existing endpoint)

- The address page calls the existing `/l2/contract-instances/${address}/balance/history`
- No backend changes needed if the address is always a fee-payer of proven txs
- Limitation: addresses that only appear as `initiator` or `msgSender` will have no history

### Option B — Fan-out in `handle-proven-block-txs.ts`

- Extend `handle-proven-block-txs.ts` to also publish `CONTRACT_INSTANCE_BALANCE_EVENT` for `initiator` addresses
- `getBalanceOf` already accepts any `AztecAddress` — minimal change

### Option C — New "address seen" event + balance snapshot

- When any new address is first seen (from pending txs, blocks, or public call requests), publish a new Kafka event
- Trigger a balance snapshot for that address
- Requires a new Kafka topic and a new "seen addresses" table

---

## Decision Points Before Implementation

1. **Which address types** should have balance history? (fee-payer only, fee-payer + initiator, all msgSenders)
2. **Historical vs. latest** — should balance be snapshotted at the proven block height (historical accuracy) or always fetched as "latest"?
3. **Endpoint reuse** — does the address page reuse `/l2/contract-instances/${address}/balance/history` or get a new dedicated endpoint?
4. **DB index** — should a migration add an index on `tx_public_call_request.msg_sender` as part of this work?

---

## Files to Touch When Implementing

| File                                                                                      | Reason                                               |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `services/aztec-listener/src/svcs/poller/pollers/block_poller/handle-proven-block-txs.ts` | Extend to snapshot balance for more address types    |
| `services/aztec-listener/src/svcs/poller/network-client/index.ts`                         | `getBalanceOf` — already reusable, no changes needed |
| `packages/message-registry/src/aztec.ts`                                                  | Add new event type if needed                         |
| `services/explorer-api/src/events/received/`                                              | New or updated Kafka consumer                        |
| `services/explorer-api/src/svcs/database/schema/`                                         | New table or migration if needed                     |
| `services/explorer-api/src/svcs/http-server/routes/`                                      | New or reused endpoint wiring                        |
| `services/explorer-api/migrations/`                                                       | DB migration for new table or index                  |
