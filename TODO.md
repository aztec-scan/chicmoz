# TODO

For changes in packages, make sure to run the following command

```bash
cd ~/c/chicmoz && yarn build:packages
```

For every medium change, make sure it builds:

```bash
cd ~/c/chicmoz/services/aztec-listener && yarn build && yarn lint
```

or

```bash
cd ~/c/chicmoz/services/explorer-api && yarn build && yarn lint
```

when all is done make sure it works

```bash
cd ~/c/chicmoz && yarn build && yarn lint && yarn test
```

## aztec-listener

### Store pending txs in aztec-listener DB

1. create new schema for pending txs
2. extract onPendingTxs to separate file
   - if the pendingTx is new, publish as pendingTxEvent
   - if there is a pendingTx in DB but no longer in pending, publish droppedTxEvent

#### schema

- txHash
- feePayer
- birthTimestamp

#### relevant files

##### Files from explorer-api for inspiration:

- /home/filip/c/chicmoz/services/explorer-api/src/events/received/on-pending-txs.ts
- /home/filip/c/chicmoz/services/explorer-api/src/svcs/database/controllers/l2Tx/get-tx.ts
- /home/filip/c/chicmoz/services/explorer-api/src/svcs/database/schema/l2tx/index.ts

##### Files to modify or adjacent files:

- /home/filip/c/chicmoz/services/aztec-listener/src/svcs/poller/pollers/txs_poller.ts
- /home/filip/c/chicmoz/services/aztec-listener/src/events/emitted/index.ts
- /home/filip/c/chicmoz/services/aztec-listener/src/svcs/database/schema.ts
- /home/filip/c/chicmoz/packages/message-registry/src/aztec.ts

### When a proven block arrives

1. go through txEffects and find pending tx in DB
2. for each pending tx
   - query balanceOf(feePayer) and publish as contractInstanceBalance
   - remove pending tx in aztec-listener

##### Files to modify or adjacent files:

- /home/filip/c/chicmoz/services/aztec-listener/src/svcs/poller/network-client/index.ts
- /home/filip/c/chicmoz/services/aztec-listener/src/svcs/poller/pollers/txs_poller.ts

## explorer-api

### Update pending txs schema to also have feePayer

#### relevant files

- /home/filip/c/chicmoz/services/explorer-api/src/svcs/database/schema/l2tx/index.ts
- /home/filip/c/chicmoz/services/explorer-api/src/svcs/database/controllers/l2Tx/\*

### Refactor onPendingTxs to just try to store the value in DB

i.e. not checking if it should be dropped etc.

#### relevant files

- /home/filip/c/chicmoz/services/explorer-api/src/events/received/on-pending-txs.ts

### Add new schema for contractInstanceBalance

needs new file

- contractAddress
- balance
- timestamp

### Add new event-listeners for droppedTxEvent(which deletes pending) and contractInstanceBalance

needs new files

#### relevant files

- /home/filip/c/chicmoz/services/explorer-api/src/events/received/index.ts

### create new endpoint that retreives balances that have an address that is also a contract instance

`/l2/contract-instance/:address/balance?isPublic=false` (default isPublic=true)

It just takes latest entry from contractInstanceBalance table

also needs new separate files

#### relevant files

##### files to take inspiration from

- /home/filip/c/chicmoz/services/explorer-api/src/svcs/http-server/routes/controllers/contract-instances.ts
- /home/filip/c/chicmoz/services/explorer-api/src/svcs/database/controllers/l2contract/get-contract-instances.ts

##### files to modify

- /home/filip/c/chicmoz/services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts
- /home/filip/c/chicmoz/services/explorer-api/src/svcs/http-server/routes/index.ts/home/filip/c/chicmoz/services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts
