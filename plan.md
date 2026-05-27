# Governance URI Backfill Plan

## Goal

Repair governance proposals whose `uri` was stored as `null` because `getURI()` failed during the original `Proposed` event handling.

Use the existing L2 block reconciliation pattern:

1. `explorer-api` detects missing data in its DB.
2. `explorer-api` publishes a bounded Kafka repair request.
3. `ethereum-listener` performs the L1 RPC reads.
4. `ethereum-listener` publishes a repair result.
5. `explorer-api` updates `uri` and resolved metadata.

This keeps chain reads in `ethereum-listener`, and keeps DB ownership in `explorer-api`.

## Current Reference Pattern

Existing L2 block repair flow:

- `services/explorer-api/src/start.ts`
- `services/explorer-api/src/svcs/reconciliation/l2-block-reconciliation.ts`
- `services/explorer-api/src/svcs/database/controllers/l2block/missing-ranges.ts`
- `services/explorer-api/src/events/emitted/index.ts`
- `services/aztec-listener/src/events/received/on-l2-block-range-request.ts`
- `services/explorer-api/src/events/received/on-block/index.ts`

Key properties to copy:

- startup repair tick
- periodic reconciliation tick
- single in-process `running` guard in explorer-api
- request IDs
- bounded request size
- stale request rejection in listener
- listener-side Bottleneck queue
- in-flight request dedupe
- result consumed by normal explorer-api event handlers

## Message Registry Changes

File: `packages/message-registry/src/ethereum.ts`

Add two L1 message types.

### Request event

Name:

```ts
L1_GOVERNANCE_URI_REQUEST_EVENT;
```

Type:

```ts
export type L1GovernanceUriRequestEvent = {
  requestId: string;
  requestedAt: number;
  reason: "startup" | "cadence" | "manual";
  proposals: Array<{
    proposalId: string;
    proposalAddress: EthAddress;
    l1BlockNumber: bigint;
  }>;
  maxProposals?: number;
};
```

### Response event

Name:

```ts
L1_GOVERNANCE_URI_RESOLVED_EVENT;
```

Type:

```ts
export type L1GovernanceUriResolvedEvent = {
  requestId?: string;
  proposalId: string;
  proposalAddress: EthAddress;
  uri: string | null;
  resolvedAt: number;
  error?: string;
};
```

Add both to `L1_MESSAGES`.

## Explorer API Implementation

### 1. Add environment settings

File: `services/explorer-api/src/environment.ts`

Add settings mirroring the L2 reconciliation style:

```ts
L1_GOVERNANCE_URI_RECONCILIATION_ENABLED = true;
L1_GOVERNANCE_URI_RECONCILIATION_INTERVAL_MS = 300000;
L1_GOVERNANCE_URI_RECONCILIATION_MAX_PROPOSALS = 25;
L1_GOVERNANCE_URI_RECONCILIATION_LOOKBACK_DAYS = 30;
```

Use conservative defaults. This does not need to be fast; it only repairs metadata.

### 2. Add DB query for proposals missing URI

File: `services/explorer-api/src/svcs/database/controllers/l1/governance/queries.ts`

Add a function like:

```ts
export const getProposalsMissingUri = async ({
  limit,
  lookbackDays,
}: {
  limit: number;
  lookbackDays: number;
}) => { ... };
```

Query `l1GovernanceProposalsTable` where:

- `uri IS NULL`
- `createdAt >= now - lookbackDays`

Order oldest first so repeatedly failing rows do not starve newer rows. If that becomes a problem later, add attempt tracking in a follow-up migration.

### 3. Add DB update for resolved URI

File: `services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts`

Add:

```ts
export const updateGovernanceProposalUri = async ({
  proposalId,
  uri,
  metadata,
}: {
  proposalId: string;
  uri: string;
  metadata: Record<string, unknown> | null;
}) => { ... };
```

Only update when `uri` is non-null. A failed backfill should not overwrite anything.

### 4. Add event publisher

File: `services/explorer-api/src/events/emitted/index.ts`

Add:

```ts
export const l1GovernanceUriRequest = async (
  request: L1GovernanceUriRequestEvent | null,
) => {
  if (request) {
    await publishMessage("L1_GOVERNANCE_URI_REQUEST_EVENT", request);
  }
};
```

### 5. Add reconciliation service

New file:

`services/explorer-api/src/svcs/reconciliation/governance-uri-reconciliation.ts`

Shape should match `l2-block-reconciliation.ts`:

- module-level `interval`
- module-level `running`
- `runGovernanceUriReconciliationOnce()`
- `startGovernanceUriReconciliation()`
- `stopGovernanceUriReconciliation()`

Tick logic:

1. fetch missing URI proposals using `getProposalsMissingUri`
2. if none, log and return
3. publish `L1_GOVERNANCE_URI_REQUEST_EVENT`

Request fields:

- `requestId: randomUUID()`
- `requestedAt: Date.now()`
- `reason: "cadence"` or `"startup"`
- `proposals`
- `maxProposals`

Add helper for startup request, or pass `reason` into the run function.

### 6. Start reconciliation from explorer-api startup

File: `services/explorer-api/src/start.ts`

After Kafka subscriptions are started, publish one startup URI repair request, then start the interval if enabled.

Keep this analogous to L2 block reconciliation:

```ts
await l1GovernanceUriRequest(await buildStartupGovernanceUriRequest());
if (L1_GOVERNANCE_URI_RECONCILIATION_ENABLED) {
  startGovernanceUriReconciliation();
}
```

### 7. Add response handler

File: `services/explorer-api/src/events/received/on-governance-events.ts`

Add handler for `L1_GOVERNANCE_URI_RESOLVED_EVENT`.

Behavior:

1. log proposal ID and whether URI resolved
2. if `uri === null`, do not update DB
3. resolve metadata with existing `resolvePayloadMetadata(uri)`
4. call `updateGovernanceProposalUri({ proposalId, uri, metadata })`

Register handler in:

`services/explorer-api/src/events/received/index.ts`

## Ethereum Listener Implementation

### 1. Export/reuse URI resolver

File: `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts`

The proposed event callback now has `resolvePayloadUri(...)`. Export it or move it to a small helper file, for example:

`services/ethereum-listener/src/network-client/contracts/callbacks/governance-uri.ts`

Keep behavior:

1. `getURI()` at event block
2. `getURI()` at latest
3. `getOriginalPayload()` then `getURI()` on original payload at latest
4. return `null` if all fail

### 2. Add emitted response publisher

File: `services/ethereum-listener/src/events/emitted/index.ts`

Add publisher for:

```ts
L1_GOVERNANCE_URI_RESOLVED_EVENT;
```

### 3. Add received request handler

New file:

`services/ethereum-listener/src/events/received/on-governance-uri-request.ts`

Model it on:

`services/aztec-listener/src/events/received/on-l2-block-range-request.ts`

Include:

- `Bottleneck` with `maxConcurrent: 1`
- in-flight dedupe set
- max request age check
- max proposals cap
- per-proposal resolution using `resolvePayloadUri(proposalAddress, l1BlockNumber)`
- response publish for every proposal, including `uri: null` failures

Suggested env vars in `services/ethereum-listener/src/environment.ts`:

```ts
L1_GOVERNANCE_URI_REQUEST_MAX_AGE_MS = 3600000;
L1_GOVERNANCE_URI_REQUEST_MAX_PROPOSALS = 25;
L1_GOVERNANCE_URI_REQUEST_QUEUE_MIN_TIME_MS = 250;
L1_GOVERNANCE_URI_REQUEST_QUEUE_HIGH_WATER = 10;
```

### 4. Subscribe ethereum-listener to the request topic

File: `services/ethereum-listener/src/events/received/index.ts`

Add `startSubscribe(governanceUriRequestHandler)`.

If ethereum-listener currently has no received-event subscription startup path beyond existing handlers, wire it the same way aztec-listener does.

## Why Not Republish `L1_GOVERNANCE_PROPOSED_EVENT`?

Do not use the original proposed event as the repair response.

Current proposal storage uses `onConflictDoNothing` on `proposalId`, so replaying a proposed event would not update a row whose `uri` is already `null` unless we also changed proposal insert semantics. A dedicated URI-resolved event makes the update explicit and avoids confusing proposal creation with metadata repair.

## Testing / Verification

### Type/build checks

Run focused builds:

```bash
yarn workspace @chicmoz-pkg/message-registry build
yarn workspace @chicmoz/ethereum-listener build
yarn workspace @chicmoz/explorer-api build
```

Run focused lint if available:

```bash
yarn workspace @chicmoz/ethereum-listener lint
yarn workspace @chicmoz/explorer-api lint
```

### Dont add test-files

### Manual local verification

Ask user/operator to deploy.

With local Kafka/Postgres running:

1. insert or identify a governance proposal row with `uri = null`
2. start explorer-api and ethereum-listener
3. confirm explorer-api publishes `L1_GOVERNANCE_URI_REQUEST_EVENT`
4. confirm ethereum-listener logs URI resolution attempt
5. confirm explorer-api receives `L1_GOVERNANCE_URI_RESOLVED_EVENT`
6. confirm DB row has non-null `uri` and populated `metadata` when the URI is resolvable

## Rollout Notes

- for default intervals: copy aztec-listener
- Keep response handling idempotent.
- Failed URI resolutions should not overwrite existing URI/metadata.
