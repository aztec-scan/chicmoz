# Plan: Populate Governance Configurations and Proposer History

## Goal

Make the `Configurations` and `Proposer History` tabs in `services/explorer-ui-v2/src/pages/governance/` show real on-chain data instead of empty tables.

## Current diagnosis

The UI already calls the right API endpoints:

- `useGovernanceConfigurations({ limit: 100 })`
- `useGovernanceProposerHistory({ limit: 100 })`

Those endpoints read from:

- `l1_governance_configurations`
- `l1_governance_proposer_history`

Explorer API already has handlers and store functions for specialized Kafka events:

- `L1_GOVERNANCE_CONFIG_UPDATED_EVENT`
- `L1_GOVERNANCE_PROPOSER_UPDATED_EVENT`

But `ethereum-listener` currently does not emit those specialized events. The relevant governance events are allowlisted as generic events in:

```txt
services/ethereum-listener/src/network-client/contracts/event-allowlist.ts
```

Current allowlist:

```ts
governance: [
  "GovernanceProposerUpdated",
  "ConfigurationUpdated",
]
```

So the events currently flow as generic contract events:

```txt
ethereum-listener -> L1_GENERIC_CONTRACT_EVENT -> generic contract event table
```

They do not flow as governance-specific events:

```txt
ethereum-listener -> L1_GOVERNANCE_CONFIG_UPDATED_EVENT
ethereum-listener -> L1_GOVERNANCE_PROPOSER_UPDATED_EVENT
```

That is why these tabs are empty.

## On-chain event details

### `GovernanceProposerUpdated`

ABI:

```solidity
event GovernanceProposerUpdated(address indexed governanceProposer)
```

This event includes the new proposer address directly. The listener can emit it without an extra contract read.

### `ConfigurationUpdated`

ABI:

```solidity
event ConfigurationUpdated(uint256 indexed time)
```

This event does not include the configuration values. To populate the API, the listener should read `Governance.getConfiguration()` at the event block, or latest as fallback if the RPC cannot serve historical state.

Configuration fields to store:

- `votingDelay`
- `votingDuration`
- `executionDelay`
- `gracePeriod`
- `quorum`
- `requiredYeaMargin`
- `minimumVotes`
- optionally `proposeConfig.lockDelay`
- optionally `proposeConfig.lockAmount`

## Implementation plan

### 1. Add structured callbacks in `ethereum-listener`

File:

```txt
services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts
```

Add callbacks for:

- `ConfigurationUpdated`
- `GovernanceProposerUpdated`

For `ConfigurationUpdated`:

1. Read `getConfiguration()` from the governance contract at `log.blockNumber`.
2. If historical state read fails, fall back to latest and log a warning/info.
3. Emit `governanceConfigUpdated` with serialized bigint-safe config values.

For `GovernanceProposerUpdated`:

1. Validate `log.args.governanceProposer` exists.
2. Emit `governanceProposerUpdated`.

### 2. Wire structured polling

File:

```txt
services/ethereum-listener/src/network-client/contracts/get-events.ts
```

Add both governance events to the governance structured event polling list using `getGovernanceStructuredEventLogs`.

### 3. Wire structured watching

File:

```txt
services/ethereum-listener/src/network-client/contracts/watch-events.ts
```

Add both events to live watchers so new updates arrive without waiting for catchup polling.

### 4. Remove generic duplication

File:

```txt
services/ethereum-listener/src/network-client/contracts/event-allowlist.ts
```

Move these out of `GENERIC_EVENT_ALLOWLIST.governance` once structured callbacks exist:

- `GovernanceProposerUpdated`
- `ConfigurationUpdated`

Optionally add them to `STRUCTURED_GOVERNANCE_EVENT_NAMES` if that set is used by watcher filtering.

### 5. Ensure message serialization is bigint-safe

File:

```txt
services/ethereum-listener/src/events/emitted/index.ts
```

`governanceConfigUpdated` should stringify nested bigint fields before publishing through Kafka BSON, matching the existing pattern used for governance vote/proposal events.

### 6. Verify explorer-api storage

Files:

```txt
services/explorer-api/src/events/received/on-governance-events.ts
services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts
packages/types/src/ethereum/governance.ts
```

Check that:

- `ChicmozL1GovernanceConfigUpdated.configuration` schema accepts the exact shape emitted by listener.
- `storeGovernanceConfigUpdated()` stores JSON-safe config values.
- `storeGovernanceProposerUpdated()` stores the proposer address, block, hash, and timestamp.

### 7. Backfill existing mainnet rows

Because Kafka offsets may already be committed, adding emitters is not enough for old data.

Backfill options:

1. Preferred: add a migration with known historical rows if only a small number exists.
2. Better long-term: add a one-shot reconciliation script that queries past `ConfigurationUpdated` and `GovernanceProposerUpdated` logs from the governance contract and inserts rows idempotently.
3. Operational fallback: reset/replay ethereum-listener governance event offsets after deploy, if safe for the environment.

The clean product fix is option 2, because it also handles future environments and avoids hand-maintaining historical constants.

### 8. UI check

File:

```txt
services/explorer-ui-v2/src/pages/governance/index.tsx
```

The UI likely needs no major wiring changes. After API rows exist, the tabs should populate.

Potential polish:

- Format configuration values by name instead of raw JSON preview.
- Link proposer address with `DashtecAddressLink` or equivalent.
- Show exact UTC timestamp on hover if existing UI patterns support it.

## Verification commands

Run focused checks:

```sh
yarn workspace @chicmoz-pkg/types build
yarn workspace @chicmoz/ethereum-listener build
yarn workspace @chicmoz/explorer-api build
yarn workspace @chicmoz/ethereum-listener lint
yarn workspace @chicmoz/explorer-api lint
yarn workspace @chicmoz-pkg/types lint
```

After deploy or local replay/backfill, verify:

```sh
curl -sS "http://api.mainnet.chicmoz.localhost:8080/v1/dev-api-key/l1/governance/configurations?limit=100"
curl -sS "http://api.mainnet.chicmoz.localhost:8080/v1/dev-api-key/l1/governance/proposer-history?limit=100"
```

Expected result: both arrays should contain at least the initial/mainnet governance config/proposer rows if the historical events exist in the scanned range.

## Risks / gotchas

- `ConfigurationUpdated` requires a contract read. If the RPC cannot serve historical state at that block, use latest fallback but mark/log that it is not an exact historical snapshot.
- Do not leave the same events in generic allowlist and structured callbacks unless duplicate generic rows are acceptable.
- Existing committed Kafka offsets mean old events will not magically appear. A backfill/replay step is required.
- `Governance.getConfiguration()` contains bigint values. Do not put raw bigint inside JSONB or JSON API responses without conversion.
- Current working tree is dirty. Preserve unrelated changes when implementing.
