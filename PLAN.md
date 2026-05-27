# Plan: Index Aztec Governance & Vote Signaling

## Overview

Index the two-stage Aztec governance process on L1:

1. **Signal Gathering** (GovernanceProposer) — validators signal support for payloads
2. **Formal Governance** (Governance contract) — proposals are voted on and executed

All data must be fetchable through the explorer API, matching the UI mockup:

- Proposal title, ID, state badge
- GitHub PR link, forum discussion link
- Payload address, proposer address
- Timeline: PENDING → VOTING → QUEUED → EXECUTED with dates
- Vote results: % For, % Against, quorum progress
- Historical signaling data: who signaled for what payload in which round

---

## 1. On-Chain Events to Index

### GovernanceProposer (extends EmpireBase)

| Event                | Signature                                                                     | Purpose                                       |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| `SignalCast`         | `(IPayload indexed payload, uint256 indexed round, address indexed signaler)` | A validator signaled for a payload in a round |
| `PayloadSubmittable` | `(IPayload indexed payload, uint256 indexed round)`                           | A payload reached quorum and can be submitted |
| `PayloadSubmitted`   | `(IPayload indexed payload, uint256 indexed round)`                           | The round winner was submitted to Governance  |

### Governance

| Event                       | Signature                                                                           | Purpose                                 |
| --------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| `Proposed`                  | `(uint256 indexed proposalId, address indexed proposal)`                            | A new proposal was created              |
| `VoteCast`                  | `(uint256 indexed proposalId, address indexed voter, bool support, uint256 amount)` | A vote was cast on a proposal           |
| `ProposalExecuted`          | `(uint256 indexed proposalId)`                                                      | A proposal was executed                 |
| `ProposalDropped`           | `(uint256 indexed proposalId)`                                                      | A proposal was dropped                  |
| `GovernanceProposerUpdated` | `(address indexed governanceProposer)`                                              | The governance proposer address changed |
| `ConfigurationUpdated`      | `(Timestamp indexed time)`                                                          | Governance configuration changed        |

---

## 2. Data Model

### 2.1 `l1_governance_proposals`

Main proposal table. One row per proposal.

| Column                        | Type        | Notes                                                                                |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `id`                          | uuid        | PK, default random                                                                   |
| `proposal_id`                 | bigint      | Unique, from on-chain                                                                |
| `payload_address`             | eth_address | The IPayload contract address                                                        |
| `proposer`                    | eth_address | Who proposed it (GovernanceProposer addr or Governance itself for proposeWithLock)   |
| `governance_proposer_address` | eth_address | Which GovernanceProposer created this proposal                                       |
| `state`                       | varchar     | Pending, Active, Queued, Executable, Rejected, Executed, Droppable, Dropped, Expired |
| `created_at`                  | timestamp   | From `Proposed` event block timestamp                                                |
| `pending_through`             | timestamp   | Computed from config.votingDelay                                                     |
| `active_through`              | timestamp   | Computed from config.votingDuration                                                  |
| `queued_through`              | timestamp   | Computed from config.executionDelay                                                  |
| `executable_through`          | timestamp   | Computed from config.gracePeriod                                                     |
| `summed_yea`                  | bigint      | Accumulated from VoteCast events                                                     |
| `summed_nay`                  | bigint      | Accumulated from VoteCast events                                                     |
| `executed_at`                 | timestamp   | From `ProposalExecuted` event                                                        |
| `dropped_at`                  | timestamp   | From `ProposalDropped` event                                                         |
| `configuration`               | jsonb       | Frozen config snapshot at proposal creation                                          |
| `uri`                         | varchar     | Raw URI from `IPayload.getURI()` (fetched off-chain)                                 |
| `metadata`                    | jsonb       | Resolved off-chain metadata: title, github_pr, forum_link, description               |
| `l1_block_number`             | bigint      |                                                                                      |
| `l1_block_hash`               | varchar     |                                                                                      |
| `l1_block_timestamp`          | timestamp   |                                                                                      |
| `l1_transaction_hash`         | varchar     |                                                                                      |
| `is_finalized`                | boolean     |                                                                                      |

Indexes:

- Unique on `proposal_id`
- Index on `state`
- Index on `created_at DESC`
- Index on `payload_address`

### 2.2 `l1_governance_votes`

Individual votes on proposals.

| Column                | Type        | Notes                   |
| --------------------- | ----------- | ----------------------- |
| `id`                  | uuid        | PK                      |
| `proposal_id`         | bigint      | FK to proposals         |
| `voter`               | eth_address |                         |
| `support`             | boolean     | true = yea, false = nay |
| `amount`              | bigint      | Voting power used       |
| `l1_block_number`     | bigint      |                         |
| `l1_block_hash`       | varchar     |                         |
| `l1_block_timestamp`  | timestamp   |                         |
| `l1_transaction_hash` | varchar     |                         |
| `l1_log_index`        | bigint      |                         |
| `is_finalized`        | boolean     |                         |

Indexes:

- Index on `proposal_id`
- Index on `voter`
- Unique on `(l1_transaction_hash, l1_log_index, is_finalized)`

### 2.3 `l1_governance_signals`

Raw signaling events from GovernanceProposer.

| Column                | Type        | Notes                      |
| --------------------- | ----------- | -------------------------- |
| `id`                  | uuid        | PK                         |
| `payload_address`     | eth_address |                            |
| `round`               | bigint      |                            |
| `signaler`            | eth_address | The validator who signaled |
| `l1_block_number`     | bigint      |                            |
| `l1_block_hash`       | varchar     |                            |
| `l1_block_timestamp`  | timestamp   |                            |
| `l1_transaction_hash` | varchar     |                            |
| `l1_log_index`        | bigint      |                            |
| `is_finalized`        | boolean     |                            |

Indexes:

- Index on `payload_address`
- Index on `round`
- Index on `signaler`
- Unique on `(l1_transaction_hash, l1_log_index, is_finalized)`

### 2.4 `l1_governance_payload_rounds`

Derived state: signal counts per payload per round.

| Column            | Type        | Notes                                           |
| ----------------- | ----------- | ----------------------------------------------- |
| `payload_address` | eth_address | Part of composite PK                            |
| `round`           | bigint      | Part of composite PK                            |
| `signal_count`    | bigint      | Number of signals received                      |
| `is_submittable`  | boolean     | Reached quorum                                  |
| `is_submitted`    | boolean     | Was the round winner and got submitted          |
| `winning_payload` | boolean     | Was the payload with most signals in this round |

### 2.5 `l1_governance_configurations`

Historical governance configurations.

| Column               | Type      | Notes              |
| -------------------- | --------- | ------------------ |
| `id`                 | uuid      | PK                 |
| `configuration`      | jsonb     | Full config object |
| `updated_at`         | timestamp |                    |
| `l1_block_number`    | bigint    |                    |
| `l1_block_hash`      | varchar   |                    |
| `l1_block_timestamp` | timestamp |                    |

### 2.6 `l1_governance_proposer_history`

Track governance proposer changes.

| Column                        | Type        | Notes |
| ----------------------------- | ----------- | ----- |
| `id`                          | uuid        | PK    |
| `governance_proposer_address` | eth_address |       |
| `updated_at`                  | timestamp   |       |
| `l1_block_number`             | bigint      |       |
| `l1_block_hash`               | varchar     |       |
| `l1_block_timestamp`          | timestamp   |       |

---

## 3. Off-Chain Metadata Resolution

The `IPayload` interface has `getURI() -> string`. This URI is the only on-chain link to human-readable content. We resolve it off-chain:

### Resolution Strategy

1. **Fetch URI on proposal creation**: When `Proposed` event is received, call `IPayload.getURI()` on-chain (via eth_call) to get the raw URI string.

2. **Parse and classify the URI**:

   - **GitHub PR URL** (e.g., `https://github.com/AztecProtocol/aztec-packages/pull/20865`):
     - Extract org, repo, PR number
     - Fetch PR title via GitHub API
     - Store as `metadata.github_pr = { org, repo, number, title, merged }`
   - **Discourse/Forum URL** (e.g., `https://forum.aztec.network/t/...`):
     - Store as `metadata.forum_link`
   - **IPFS CID** (e.g., `ipfs://Qm...` or `https://ipfs.io/ipfs/Qm...`):
     - Fetch content, parse as JSON or markdown
     - Extract title, description
   - **Plain text URI**:
     - Store as-is in `metadata.description`

3. **Store resolved metadata** in `l1_governance_proposals.metadata` as JSONB:

```json
{
  "title": "feat: alpha network upgrade",
  "github_pr": {
    "org": "AztecProtocol",
    "repo": "aztec-packages",
    "number": 20865,
    "title": "feat: alpha network upgrade",
    "merged": true,
    "url": "https://github.com/AztecProtocol/aztec-packages/pull/20865"
  },
  "forum_link": "https://forum.aztec.network/t/proposal-alpha-network/123",
  "description": "This proposal upgrades the alpha network..."
}
```

4. **Fallback**: If URI fetch fails or returns nothing, store `metadata = { title: null, description: null }` and allow manual override via admin API later.

---

## 4. Implementation: ethereum-listener

### 4.1 Contract Resolution

**File**: `services/ethereum-listener/src/network-client/contracts/index.ts`

Extend `getL1Contracts()` to resolve and cache:

- `governance` address: `registry.getGovernance()`
- `governanceProposer` address: `governance.governanceProposer()`

Store these in `l1ContractAddresses` table (extend the JSON schema). Refresh watchers when `GovernanceProposerUpdated` event fires.

### 4.2 Event Allowlist

**File**: `services/ethereum-listener/src/network-client/contracts/event-allowlist.ts`

```ts
export const STRUCTURED_GOVERNANCE_EVENTS = new Set([
  "SignalCast",
  "PayloadSubmittable",
  "PayloadSubmitted",
  "Proposed",
  "VoteCast",
  "ProposalExecuted",
  "ProposalDropped",
]);

export const GENERIC_EVENT_ALLOWLIST = {
  // ... existing ...
  governance: [
    "GovernanceProposerUpdated",
    "ConfigurationUpdated",
    "Deposit",
    "WithdrawInitiated",
    "WithdrawFinalized",
    "BeneficiaryAdded",
    "FloodGatesOpened",
  ],
  governanceProposer: ["SignalCast", "PayloadSubmittable", "PayloadSubmitted"],
  // ...
};
```

### 4.3 Structured Callbacks

**File**: `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts` (new)

Create callback factories for each structured event. Each:

1. Parses event args
2. Enriches with L1 block timestamp
3. Emits to Kafka via new topic

Example for `Proposed`:

```ts
export const proposedEventCallbacks = (args: OnLogsCallbackWrapperArgs) => ({
  onError: onError("Governance Proposed error"),
  onLogs: async (logs) => {
    for (const log of logs) {
      // Fetch URI from payload contract
      const uri = await getPublicHttpClient().readContract({
        address: log.args.proposal,
        abi: payloadAbi,
        functionName: "getURI",
        blockNumber: log.blockNumber,
      });

      await emit.governanceProposed({
        proposalId: log.args.proposalId,
        proposalAddress: log.args.proposal,
        uri: uri ?? null,
        l1BlockNumber: log.blockNumber,
        l1BlockHash: log.blockHash,
        l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
        l1TransactionHash: log.transactionHash,
        l1LogIndex: log.logIndex,
        isFinalized: args.isFinalized,
      });
      args.updateHeight(log.blockNumber);
    }
    await args.storeHeight();
  },
});
```

### 4.4 Watchers

**File**: `services/ethereum-listener/src/network-client/contracts/watch-events.ts`

Add watchers for all structured governance events. Wire into `watchAllContractsEvents()`.

### 4.5 Types & Message Registry

**File**: `packages/types/src/ethereum/governance.ts` (new)

Define zod schemas for all 7 structured events + configuration/proposer history events.

**File**: `packages/message-registry/src/ethereum.ts`

Add to `L1_MESSAGES`:

```ts
L1_GOVERNANCE_SIGNAL_CAST_EVENT: ChicmozL1GovernanceSignalCast;
L1_GOVERNANCE_PAYLOAD_SUBMITTABLE_EVENT: ChicmozL1GovernancePayloadSubmittable;
L1_GOVERNANCE_PAYLOAD_SUBMITTED_EVENT: ChicmozL1GovernancePayloadSubmitted;
L1_GOVERNANCE_PROPOSED_EVENT: ChicmozL1GovernanceProposed;
L1_GOVERNANCE_VOTE_CAST_EVENT: ChicmozL1GovernanceVoteCast;
L1_GOVERNANCE_PROPOSAL_EXECUTED_EVENT: ChicmozL1GovernanceProposalExecuted;
L1_GOVERNANCE_PROPOSAL_DROPPED_EVENT: ChicmozL1GovernanceProposalDropped;
L1_GOVERNANCE_CONFIG_UPDATED_EVENT: ChicmozL1GovernanceConfigUpdated;
L1_GOVERNANCE_PROPOSER_UPDATED_EVENT: ChicmozL1GovernanceProposerUpdated;
```

### 4.6 Emit Functions

**File**: `services/ethereum-listener/src/events/emitted/index.ts`

Add emit functions for each new event type.

---

## 5. Implementation: explorer-api

### 5.1 Database Schema & Migration

**File**: `services/explorer-api/src/svcs/database/schema/l1/governance.ts` (new)

Define all 6 Drizzle tables as specified in Section 2.

**File**: `services/explorer-api/migrations/` (new)

Generate migration via `drizzle-kit generate`.

### 5.2 Event Handlers

**File**: `services/explorer-api/src/events/received/on-governance-events.ts` (new)

Kafka handlers for each event type:

| Handler                          | Action                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `onGovernanceProposed`           | Insert proposal row. Fetch & resolve URI metadata. Compute timeline timestamps from frozen config.                                          |
| `onGovernanceVoteCast`           | Insert vote row. Update `summed_yea`/`summed_nay` on proposal.                                                                              |
| `onGovernanceProposalExecuted`   | Update proposal `state = 'Executed'`, set `executed_at`.                                                                                    |
| `onGovernanceProposalDropped`    | Update proposal `state = 'Dropped'`, set `dropped_at`.                                                                                      |
| `onGovernanceSignalCast`         | Insert signal row. Upsert `l1_governance_payload_rounds` (increment signal_count).                                                          |
| `onGovernancePayloadSubmittable` | Update `l1_governance_payload_rounds.is_submittable = true`.                                                                                |
| `onGovernancePayloadSubmitted`   | Update `l1_governance_payload_rounds.is_submitted = true`, `winning_payload = true`. Find matching proposal by payload_address and link it. |
| `onGovernanceConfigUpdated`      | Insert new configuration row.                                                                                                               |
| `onGovernanceProposerUpdated`    | Insert proposer history row. Trigger watcher refresh.                                                                                       |

### 5.3 Metadata Resolution Service

**File**: `services/explorer-api/src/svcs/metadata-resolver/index.ts` (new)

```ts
export const resolvePayloadMetadata = async (
  uri: string | null,
): Promise<GovernanceProposalMetadata> => {
  if (!uri)
    return {
      title: null,
      github_pr: null,
      forum_link: null,
      description: null,
    };

  // GitHub PR
  const githubMatch = uri.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (githubMatch) {
    const [, org, repo, number] = githubMatch;
    const pr = await fetchGitHubPR(org, repo, parseInt(number));
    return {
      title: pr.title,
      github_pr: {
        org,
        repo,
        number: parseInt(number),
        title: pr.title,
        merged: pr.merged,
        url: uri,
      },
      forum_link: null,
      description: pr.body?.slice(0, 500) ?? null,
    };
  }

  // Forum link
  if (uri.includes("forum.aztec.network") || uri.includes("discourse")) {
    return { title: null, github_pr: null, forum_link: uri, description: null };
  }

  // IPFS
  if (uri.startsWith("ipfs://") || uri.includes("/ipfs/")) {
    const content = await fetchIpfsContent(uri);
    return parseIpfsMetadata(content);
  }

  // Fallback
  return { title: null, github_pr: null, forum_link: null, description: uri };
};
```

### 5.4 API Endpoints

**File**: `services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts`

```ts
// Governance proposals
governanceProposals: "/l1/governance/proposals",
governanceProposal: "/l1/governance/proposals/:proposalId",
governanceProposalVotes: "/l1/governance/proposals/:proposalId/votes",
governanceProposalSignals: "/l1/governance/proposals/:proposalId/signals",

// Governance signals (raw)
governanceSignals: "/l1/governance/signals",
governanceSignalsByRound: "/l1/governance/signals/round/:round",
governanceSignalsByPayload: "/l1/governance/signals/payload/:payloadAddress",

// Governance config & history
governanceConfigurations: "/l1/governance/configurations",
governanceProposerHistory: "/l1/governance/proposer-history",
```

**File**: `services/explorer-api/src/svcs/http-server/routes/controllers/governance.ts` (new)

| Endpoint                                             | Method | Description                                                                                                                                                                             |
| ---------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /l1/governance/proposals`                       | GET    | List proposals. Query params: `state`, `from`, `to`, `offset`, `limit`. Returns array with computed fields: `votePercentageFor`, `votePercentageAgainst`, `quorumProgress`, `timeline`. |
| `GET /l1/governance/proposals/:proposalId`           | GET    | Single proposal detail. Includes resolved metadata, timeline, vote summary.                                                                                                             |
| `GET /l1/governance/proposals/:proposalId/votes`     | GET    | Paginated votes for a proposal. Query: `offset`, `limit`, `support` (filter by yea/nay).                                                                                                |
| `GET /l1/governance/proposals/:proposalId/signals`   | GET    | Signals related to this proposal (matched by payload_address across all rounds).                                                                                                        |
| `GET /l1/governance/signals`                         | GET    | List all signals. Query: `payloadAddress`, `round`, `signaler`, `offset`, `limit`.                                                                                                      |
| `GET /l1/governance/signals/round/:round`            | GET    | All signals in a specific round.                                                                                                                                                        |
| `GET /l1/governance/signals/payload/:payloadAddress` | GET    | All signals for a specific payload.                                                                                                                                                     |
| `GET /l1/governance/configurations`                  | GET    | Historical configurations.                                                                                                                                                              |
| `GET /l1/governance/proposer-history`                | GET    | Governance proposer change history.                                                                                                                                                     |

### 5.5 Computed Fields (API Response Enrichment)

The API computes derived fields on-the-fly from stored data:

```ts
// For each proposal in list/detail response:
{
  proposalId: "20865",
  payloadAddress: "0x1758...c380",
  proposer: "0x06Ef...63ef",
  state: "Executed",
  metadata: {
    title: "feat: alpha network upgrade",
    github_pr: { org: "AztecProtocol", repo: "aztec-packages", number: 20865, title: "...", merged: true, url: "..." },
    forum_link: "https://forum.aztec.network/t/...",
  },
  timeline: {
    pending: { date: "2026-03-13T00:00:00Z" },
    voting: { date: "2026-03-16T00:00:00Z" },
    queued: { date: "2026-03-23T00:00:00Z" },
    executed: { date: "2026-03-30T00:00:00Z" },
  },
  voteResults: {
    yea: "1000000000000000000000",
    nay: "0",
    percentageFor: 100.0,
    percentageAgainst: 0.0,
    quorum: 66.67,
    quorumProgress: 100.0,
    totalPowerAtSnapshot: "1500000000000000000000",
  },
  signalingSummary: {
    round: 42,
    signalCount: 15,
    quorumSize: 10,
    wasWinner: true,
  },
  createdAt: "2026-03-13T00:00:00Z",
  executedAt: "2026-03-30T00:00:00Z",
}
```

**Computation logic**:

- `timeline.*.date`: Derived from `created_at` + config delays
- `voteResults.percentageFor`: `summed_yea / (summed_yea + summed_nay) * 100`
- `voteResults.quorumProgress`: `(summed_yea + summed_nay) / config.minimumVotes * 100` (capped at 100)
- `signalingSummary`: Look up `l1_governance_payload_rounds` by `payload_address`, find the round where `is_submitted = true`
- `state`: Stored from events, but can be recomputed from timestamps if needed for consistency

---

## 6. File Change Summary

| File                                                                              | Action  | Description                                                 |
| --------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------- |
| `packages/types/src/ethereum/governance.ts`                                       | **NEW** | Zod schemas for all governance event types                  |
| `packages/types/src/ethereum/index.ts`                                            | EDIT    | Export new governance types                                 |
| `packages/message-registry/src/ethereum.ts`                                       | EDIT    | Add 9 new L1 message types                                  |
| `services/ethereum-listener/src/network-client/contracts/utils.ts`                | EDIT    | Add `governance` and `governanceProposer` to AztecContracts |
| `services/ethereum-listener/src/network-client/contracts/index.ts`                | EDIT    | Resolve governance addresses, extend getL1Contracts         |
| `services/ethereum-listener/src/network-client/contracts/event-allowlist.ts`      | EDIT    | Add governance event allowlists                             |
| `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts` | **NEW** | Structured callbacks for 7 governance events                |
| `services/ethereum-listener/src/network-client/contracts/callbacks/index.ts`      | EDIT    | Export new governance callbacks                             |
| `services/ethereum-listener/src/network-client/contracts/watch-events.ts`         | EDIT    | Add governance event watchers                               |
| `services/ethereum-listener/src/events/emitted/index.ts`                          | EDIT    | Add 9 governance emit functions                             |
| `services/explorer-api/src/svcs/database/schema/l1/governance.ts`                 | **NEW** | 6 Drizzle tables for governance data                        |
| `services/explorer-api/src/svcs/database/schema/l1/index.ts`                      | EDIT    | Export new schema                                           |
| `services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts`      | **NEW** | Store functions                                             |
| `services/explorer-api/src/svcs/database/controllers/l1/governance/queries.ts`    | **NEW** | Query functions                                             |
| `services/explorer-api/src/svcs/metadata-resolver/index.ts`                       | **NEW** | Off-chain URI resolution service                            |
| `services/explorer-api/src/events/received/on-governance-events.ts`               | **NEW** | 9 Kafka handlers                                            |
| `services/explorer-api/src/events/received/index.ts`                              | EDIT    | Export new handlers                                         |
| `services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts`       | EDIT    | Add 9 governance API paths + validation schemas             |
| `services/explorer-api/src/svcs/http-server/routes/index.ts`                      | EDIT    | Add governance route registrations                          |
| `services/explorer-api/src/svcs/http-server/routes/controllers/governance.ts`     | **NEW** | 9 API controllers with OpenAPI specs                        |
| `services/explorer-api/src/svcs/http-server/routes/controllers/index.ts`          | EDIT    | Export new controllers                                      |
| `services/explorer-api/migrations/xxxx_governance_tables.sql`                     | **NEW** | Drizzle migration                                           |

**Total**: 22 files, 8 new, 14 edits.

---

## 7. Implementation Order

1. **Types & Message Registry** — Define schemas, types, Kafka topics
2. **ethereum-listener: Contract Resolution** — Add governance contracts to watcher setup
3. **ethereum-listener: Event Allowlist & Callbacks** — Add events, create structured callbacks
4. **ethereum-listener: Watchers & Emitters** — Wire watchers, add emit functions
5. **explorer-api: Database Schema** — Create Drizzle tables, generate migration
6. **explorer-api: Metadata Resolver** — Implement off-chain URI resolution
7. **explorer-api: Event Handlers** — Create Kafka handlers to store events
8. **explorer-api: API Endpoints** — Add REST endpoints with computed fields
9. **Testing** — Test against testnet, verify metadata resolution, check computed fields

---

## 8. Risks & Considerations

- **GovernanceProposer address changes**: `GovernanceProposerUpdated` event must trigger watcher refresh. Old proposer events still indexed; new proposer events flow to new watcher.
- **URI resolution failures**: GitHub API rate limits, IPFS gateway downtime. Implement retry with exponential backoff. Store raw URI as fallback. Allow admin override.
- **BigInt serialization**: Vote amounts and proposal IDs are bigints. Ensure consistent string serialization in Kafka messages and JSON API responses.
- **Reorg handling**: Existing `isFinalized` pattern handles this. Non-finalized events stored but not surfaced in default API queries.
- **Proposal state consistency**: State is stored from events but can drift if events are missed. Add a reconciliation job that recomputes state from timestamps + config for stale proposals.
- **Signal-to-proposal linking**: Signals reference `payloadAddress`, proposals reference `payloadAddress` too. Link them by matching addresses. A payload may be submitted multiple times across rounds; use `is_submitted = true` to find the winning round.
- **Quorum computation**: Quorum is a percentage of total power at snapshot time. Store `totalPowerAtSnapshot` on proposal or fetch from `Governance.totalPowerAt(pendingThrough)` when needed.
