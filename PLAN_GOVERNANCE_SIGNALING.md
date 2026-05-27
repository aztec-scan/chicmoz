# Plan: Index Governance Vote Signaling & Slashing Proposer Events

## Research Summary

### How Vote Signaling Works on Aztec L1 Contracts

Aztec has a **two-stage governance process** on L1 (Ethereum):

#### Stage 1: Signal Gathering (GovernanceProposer)

- **Contract**: `GovernanceProposer` extends `EmpireBase`
- **Purpose**: Validators (checkpoint proposers) signal support for governance payloads before they reach the Governance contract
- **Mechanism**:
  - Time is divided into **rounds** of `ROUND_SIZE` slots
  - Each slot has a designated **signaler** (the current checkpoint proposer from the canonical rollup)
  - The signaler calls `signal(IPayload)` or `signalWithSig(IPayload, Signature)` to support a payload
  - Signals accumulate per payload within a round
  - First payload to reach `QUORUM_SIZE` signals becomes **submittable**
  - After the round ends + `EXECUTION_DELAY_IN_ROUNDS`, anyone can call `submitRoundWinner(roundNumber)` to submit the winning payload to Governance
- **Key Events** (from `IEmpire`):
  - `SignalCast(IPayload indexed payload, uint256 indexed round, address indexed signaler)`
  - `PayloadSubmittable(IPayload indexed payload, uint256 indexed round)`
  - `PayloadSubmitted(IPayload indexed payload, uint256 indexed round)`

#### Stage 2: Formal Governance (Governance contract)

- **Contract**: `Governance`
- **Purpose**: Actual voting and execution of proposals using staking power
- **Mechanism**:
  - The GovernanceProposer wraps payloads in `GSEPayload` and calls `propose()` on Governance
  - The GSE (Governance Staking Engine) votes using aggregated stake from all rollup instances
  - Proposal lifecycle: Pending → Active → (Rejected or Queued) → Executable → Executed/Expired
- **Key Events** (from `IGovernance`):
  - `Proposed(uint256 indexed proposalId, address indexed proposal)`
  - `VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 amount)`
  - `ProposalExecuted(uint256 indexed proposalId)`
  - `ProposalDropped(uint256 indexed proposalId)`
  - `GovernanceProposerUpdated(address indexed governanceProposer)`
  - `ConfigurationUpdated(Timestamp indexed time)`
  - `Deposit(address indexed depositor, address indexed onBehalfOf, uint256 amount)`
  - `WithdrawInitiated(uint256 indexed withdrawalId, address indexed recipient, uint256 amount)`
  - `WithdrawFinalized(uint256 indexed withdrawalId)`
  - `BeneficiaryAdded(address beneficiary)`
  - `FloodGatesOpened()`

#### SlashingProposer (separate system)

- **Contract**: `SlashingProposer` (in `src/core/slashing/`)
- **Purpose**: Aggregates validator votes to determine which validators should be slashed
- **Mechanism**:
  - Similar round-based voting but for slashing decisions
  - Proposers vote on slashing validators from past epochs (`SLASH_OFFSET_IN_ROUNDS` rounds ago)
  - Votes are encoded as bytes (2 bits per validator, 0-3 slash units)
  - After execution delay, `executeRound()` tallies votes and slashes validators reaching quorum
- **Key Events**:
  - `VoteCast(SlashRound indexed round, Slot indexed slot, address indexed proposer)`
  - `RoundExecuted(SlashRound indexed round, uint256 slashCount)`

### Contract Address Discovery

- **Governance**: Available via `Registry.getGovernance()`
- **GovernanceProposer**: Available via `Governance.governanceProposer()` (public variable)
- **SlashingProposer**: Deployed during rollup setup via `SlasherDeploymentExtLib`, address stored in the Slasher contract. The Rollup/Slasher relationship can be queried.

---

## Implementation Plan

### Phase 1: ethereum-listener — Watch Governance & Slashing Events

#### 1.1 Add Governance and SlashingProposer to contract watchers

**File**: `services/ethereum-listener/src/network-client/contracts/index.ts`

- Add `GovernanceAbi` and `SlashingProposerAbi` imports from `@aztec/l1-artifacts`
- Extend `AztecContracts` type to include `governance` and `slashingProposer` contracts
- Add functions to resolve contract addresses:
  - Governance: query `registry.getGovernance()`
  - GovernanceProposer: query `governance.governanceProposer()`
  - SlashingProposer: needs to be resolved from the Slasher (or stored in chain info / config)

**File**: `services/ethereum-listener/src/network-client/contracts/utils.ts`

- Extend `AztecContracts` and `AztecContract` types with `governance` and `slashingProposer`

#### 1.2 Add events to the allowlist

**File**: `services/ethereum-listener/src/network-client/contracts/event-allowlist.ts`

Add to the allowlist:

```ts
export const STRUCTURED_ROLLUP_EVENT_NAMES = new Set([
  "CheckpointProposed",
  "L2ProofVerified",
  // NEW - governance signaling events
  "SignalCast",
  "PayloadSubmittable",
  "PayloadSubmitted",
  // NEW - governance events
  "Proposed",
  "VoteCast",
  "ProposalExecuted",
  "ProposalDropped",
]);

export const GENERIC_EVENT_ALLOWLIST = {
  rollup: [...],
  registry: ["CanonicalRollupUpdated"],
  governance: [
    "GovernanceProposerUpdated",
    "ConfigurationUpdated",
    "Deposit",
    "WithdrawInitiated",
    "WithdrawFinalized",
    "BeneficiaryAdded",
    "FloodGatesOpened",
  ],
  governanceProposer: [
    "SignalCast",
    "PayloadSubmittable",
    "PayloadSubmitted",
  ],
  slashingProposer: [
    "VoteCast",
    "RoundExecuted",
  ],
  inbox: [],
  outbox: [],
  feeJuicePortal: [],
};
```

**Decision**: Governance signaling events (`SignalCast`, `PayloadSubmittable`, `PayloadSubmitted`) are important enough to have **structured handlers** (like `CheckpointProposed`), not just generic. Governance events (`Proposed`, `VoteCast`, `ProposalExecuted`, `ProposalDropped`) should also be structured. Slashing events can start as generic and be structured later.

#### 1.3 Create structured event callbacks

**File**: `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts` (new)

Create callback factories for:

- `signalCastEventCallbacks` — emits `L1_GOVERNANCE_SIGNAL_CAST_EVENT`
- `payloadSubmittableEventCallbacks` — emits `L1_GOVERNANCE_PAYLOAD_SUBMITTABLE_EVENT`
- `payloadSubmittedEventCallbacks` — emits `L1_GOVERNANCE_PAYLOAD_SUBMITTED_EVENT`
- `governanceProposedEventCallbacks` — emits `L1_GOVERNANCE_PROPOSED_EVENT`
- `governanceVoteCastEventCallbacks` — emits `L1_GOVERNANCE_VOTE_CAST_EVENT`
- `governanceProposalExecutedEventCallbacks` — emits `L1_GOVERNANCE_PROPOSAL_EXECUTED_EVENT`
- `governanceProposalDroppedEventCallbacks` — emits `L1_GOVERNANCE_PROPOSAL_DROPPED_EVENT`

Each callback:

1. Parses the event args using a zod schema
2. Enriches with L1 block timestamp
3. Emits to the message bus via `emit.*`

**File**: `services/ethereum-listener/src/network-client/contracts/watch-events.ts`

Add watchers for structured governance events:

- `watchGovernanceProposerSignalCast`
- `watchGovernanceProposerPayloadSubmittable`
- `watchGovernanceProposerPayloadSubmitted`
- `watchGovernanceProposed`
- `watchGovernanceVoteCast`
- `watchGovernanceProposalExecuted`
- `watchGovernanceProposalDropped`

Wire them into `watchAllContractsEvents`.

#### 1.4 Add new types and message bus topics

**File**: `packages/types/src/ethereum/governance.ts` (new)

Define zod schemas and TypeScript types:

```ts
// SignalCast from GovernanceProposer
export const chicmozL1GovernanceSignalCastSchema = z.object({
  payloadAddress: ethAddressSchema,
  round: z.coerce.bigint(),
  signaler: ethAddressSchema,
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});

// PayloadSubmittable
export const chicmozL1GovernancePayloadSubmittableSchema = z.object({ ... });

// PayloadSubmitted
export const chicmozL1GovernancePayloadSubmittedSchema = z.object({ ... });

// Proposed (from Governance)
export const chicmozL1GovernanceProposedSchema = z.object({
  proposalId: z.coerce.bigint(),
  proposalAddress: ethAddressSchema,
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});

// VoteCast (from Governance)
export const chicmozL1GovernanceVoteCastSchema = z.object({
  proposalId: z.coerce.bigint(),
  voter: ethAddressSchema,
  support: z.boolean(),
  amount: z.coerce.bigint(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});

// ProposalExecuted
export const chicmozL1GovernanceProposalExecutedSchema = z.object({ ... });

// ProposalDropped
export const chicmozL1GovernanceProposalDroppedSchema = z.object({ ... });
```

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
```

**File**: `services/ethereum-listener/src/events/emitted/index.ts`

Add emit functions for each new event type.

---

### Phase 2: explorer-api — Store and Serve Governance Events

#### 2.1 Database schema for governance events

**File**: `services/explorer-api/src/svcs/database/schema/l1/governance-events.ts` (new)

Create Drizzle tables:

```ts
// l1_governance_signal_cast — tracks validator signals in GovernanceProposer
export const l1GovernanceSignalCastTable = pgTable(
  "l1_governance_signal_cast",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payloadAddress: generateEthAddressColumn("payload_address").notNull(),
    round: bigint("round", { mode: "bigint" }).notNull(),
    signaler: generateEthAddressColumn("signaler").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
    l1LogIndex: bigint("l1_log_index", { mode: "number" }),
    isFinalized: boolean("is_finalized").notNull().default(false),
  },
  (table) => ({
    uniqueLog: uniqueIndex("governance_signal_cast_unique").on(
      table.l1TransactionHash,
      table.l1LogIndex,
      table.l1ContractAddress,
      table.isFinalized,
    ),
  }),
);

// l1_governance_proposals — tracks proposals in Governance contract
export const l1GovernanceProposalsTable = pgTable("l1_governance_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: bigint("proposal_id", { mode: "bigint" }).notNull().unique(),
  proposalAddress: generateEthAddressColumn("proposal_address").notNull(),
  proposer: generateEthAddressColumn("proposer"), // resolved via on-chain query
  governanceProposerAddress: generateEthAddressColumn(
    "governance_proposer_address",
  ), // which govProposer created it
  createdAt: generateTimestampColumn("created_at").notNull(),
  l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
  l1BlockHash: varchar("l1_block_hash").notNull(),
  l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
  l1TransactionHash: varchar("l1_transaction_hash"),
  state: varchar("state").notNull().default("Pending"), // Pending, Active, Queued, Executable, Rejected, Executed, Droppable, Dropped, Expired
  summedYea: bigint("summed_yea", { mode: "bigint" }).notNull().default(0),
  summedNay: bigint("summed_nay", { mode: "bigint" }).notNull().default(0),
  executedAt: generateTimestampColumn("executed_at"),
  droppedAt: generateTimestampColumn("dropped_at"),
});

// l1_governance_votes — tracks individual votes on proposals
export const l1GovernanceVotesTable = pgTable(
  "l1_governance_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: bigint("proposal_id", { mode: "bigint" }).notNull(),
    voter: generateEthAddressColumn("voter").notNull(),
    support: boolean("support").notNull(),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
    l1LogIndex: bigint("l1_log_index", { mode: "number" }),
    isFinalized: boolean("is_finalized").notNull().default(false),
  },
  (table) => ({
    proposalIdx: index("governance_votes_proposal_idx").on(table.proposalId),
    voterIdx: index("governance_votes_voter_idx").on(table.voter),
    uniqueLog: uniqueIndex("governance_votes_unique").on(
      table.l1TransactionHash,
      table.l1LogIndex,
      table.isFinalized,
    ),
  }),
);

// l1_governance_payload_signals — tracks signals per payload per round (derived from SignalCast)
export const l1GovernancePayloadSignalsTable = pgTable(
  "l1_governance_payload_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payloadAddress: generateEthAddressColumn("payload_address").notNull(),
    round: bigint("round", { mode: "bigint" }).notNull(),
    signalCount: bigint("signal_count", { mode: "bigint" })
      .notNull()
      .default(1),
    isSubmittable: boolean("is_submittable").notNull().default(false),
    isSubmitted: boolean("is_submitted").notNull().default(false),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
  },
  (table) => ({
    payloadRoundUnique: uniqueIndex("governance_payload_signals_unique").on(
      table.payloadAddress,
      table.round,
    ),
  }),
);
```

#### 2.2 Event handlers in explorer-api

**File**: `services/explorer-api/src/events/received/on-governance-events.ts` (new)

Create Kafka event handlers for each governance event type:

- `onGovernanceSignalCast` — stores in `l1_governance_signal_cast` and upserts `l1_governance_payload_signals`
- `onGovernancePayloadSubmittable` — updates `l1_governance_payload_signals.isSubmittable`
- `onGovernancePayloadSubmitted` — updates `l1_governance_payload_signals.isSubmitted`
- `onGovernanceProposed` — inserts into `l1_governance_proposals`
- `onGovernanceVoteCast` — inserts into `l1_governance_votes` and updates `l1_governance_proposals.summedYea/summedNay`
- `onGovernanceProposalExecuted` — updates `l1_governance_proposals.state = 'Executed'`, sets `executedAt`
- `onGovernanceProposalDropped` — updates `l1_governance_proposals.state = 'Dropped'`, sets `droppedAt`

**File**: `services/explorer-api/src/events/received/index.ts`

Export the new handlers.

#### 2.3 Database controllers

**File**: `services/explorer-api/src/svcs/database/controllers/l1/governance/` (new directory)

- `store.ts` — store functions for each table
- `queries.ts` — read functions for API endpoints

#### 2.4 API endpoints

**File**: `services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts`

Add paths:

```ts
governanceProposals: "/l1/governance/proposals",
governanceProposal: "/l1/governance/proposals/:proposalId",
governanceProposalVotes: "/l1/governance/proposals/:proposalId/votes",
governanceSignals: "/l1/governance/signals",
governanceSignalsByRound: "/l1/governance/signals/round/:round",
governanceSignalsByPayload: "/l1/governance/signals/payload/:payloadAddress",
```

**File**: `services/explorer-api/src/svcs/http-server/routes/index.ts`

Add route registrations and OpenAPI specs.

**File**: `services/explorer-api/src/svcs/http-server/routes/controllers/` (new or extend existing)

Add controllers:

- `GET_L1_GOVERNANCE_PROPOSALS` — list proposals with pagination, filtering by state
- `GET_L1_GOVERNANCE_PROPOSAL` — single proposal detail
- `GET_L1_GOVERNANCE_PROPOSAL_VOTES` — votes for a proposal
- `GET_L1_GOVERNANCE_SIGNALS` — list signals with pagination
- `GET_L1_GOVERNANCE_SIGNALS_BY_ROUND` — signals for a specific round
- `GET_L1_GOVERNANCE_SIGNALS_BY_PAYLOAD` — signals for a specific payload

---

### Phase 3: Contract Address Resolution

#### 3.1 Resolve Governance and GovernanceProposer addresses

The Governance address is already available via `Registry.getGovernance()`. The GovernanceProposer is a public variable on the Governance contract.

**File**: `services/ethereum-listener/src/network-client/contracts/index.ts`

Extend `getL1Contracts` to also fetch and cache:

- `governance` address from `registry.getGovernance()`
- `governanceProposer` address from `governance.governanceProposer()`

These should be stored in the `l1ContractAddresses` DB table (extend the JSON schema) so they persist across restarts.

#### 3.2 SlashingProposer address

The SlashingProposer is deployed during rollup setup. Its address can be:

1. Queried from the Slasher contract if it exposes a getter
2. Discovered via event scanning (`SlashingProposer` deployment events)
3. Configured via environment variable as a fallback

For initial implementation, add it as a configurable address with auto-discovery as a follow-up.

---

### File Change Summary

| File                                                                              | Action  | Description                                 |
| --------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| `packages/types/src/ethereum/governance.ts`                                       | **NEW** | Zod schemas + types for governance events   |
| `packages/types/src/ethereum/index.ts`                                            | EDIT    | Export new governance types                 |
| `packages/message-registry/src/ethereum.ts`                                       | EDIT    | Add new L1 message types                    |
| `services/ethereum-listener/src/network-client/contracts/utils.ts`                | EDIT    | Add governance/slashing to AztecContracts   |
| `services/ethereum-listener/src/network-client/contracts/index.ts`                | EDIT    | Add governance/slashing contract resolution |
| `services/ethereum-listener/src/network-client/contracts/event-allowlist.ts`      | EDIT    | Add governance event allowlists             |
| `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts` | **NEW** | Structured callbacks for governance events  |
| `services/ethereum-listener/src/network-client/contracts/callbacks/index.ts`      | EDIT    | Export new governance callbacks             |
| `services/ethereum-listener/src/network-client/contracts/watch-events.ts`         | EDIT    | Add governance event watchers               |
| `services/ethereum-listener/src/events/emitted/index.ts`                          | EDIT    | Add governance emit functions               |
| `services/explorer-api/src/svcs/database/schema/l1/governance-events.ts`          | **NEW** | Drizzle tables for governance data          |
| `services/explorer-api/src/svcs/database/schema/l1/index.ts`                      | EDIT    | Export new schema                           |
| `services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts`      | **NEW** | Store functions                             |
| `services/explorer-api/src/svcs/database/controllers/l1/governance/queries.ts`    | **NEW** | Query functions                             |
| `services/explorer-api/src/events/received/on-governance-events.ts`               | **NEW** | Kafka handlers for governance events        |
| `services/explorer-api/src/events/received/index.ts`                              | EDIT    | Export new handlers                         |
| `services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts`       | EDIT    | Add governance API paths                    |
| `services/explorer-api/src/svcs/http-server/routes/index.ts`                      | EDIT    | Add governance routes                       |
| `services/explorer-api/src/svcs/http-server/routes/controllers/governance.ts`     | **NEW** | API controllers                             |
| `services/explorer-api/src/svcs/http-server/routes/controllers/index.ts`          | EDIT    | Export new controllers                      |
| `services/explorer-api/migrations/`                                               | **NEW** | Drizzle migration for new tables            |

---

### Implementation Order

1. **Types & Message Registry** — Define schemas, types, and Kafka topics
2. **ethereum-listener: Contract Resolution** — Add governance/slashing contracts to watcher setup
3. **ethereum-listener: Event Allowlist** — Add events to allowlist
4. **ethereum-listener: Callbacks & Watchers** — Create structured callbacks and wire watchers
5. **ethereum-listener: Emit Functions** — Add emit functions for new event types
6. **explorer-api: Database Schema** — Create Drizzle tables and migration
7. **explorer-api: Event Handlers** — Create Kafka handlers to store events
8. **explorer-api: API Endpoints** — Add REST endpoints for querying governance data
9. **Testing & Verification** — Test against testnet/mainnet contract addresses

### Risks & Considerations

- **GovernanceProposer address changes**: If governance updates the proposer, the old address stops emitting. The `GovernanceProposerUpdated` event should trigger a watcher refresh.
- **SlashingProposer address discovery**: May need manual config initially. Follow up with on-chain resolution.
- **BigInt handling**: Vote amounts and proposal IDs are bigints — ensure consistent serialization in Kafka messages and DB storage.
- **Reorg handling**: The existing `isFinalized` flag pattern handles this. Governance events on non-finalized blocks should be marked accordingly.
- **Payload URI resolution**: `IPayload.getURI()` returns a human-readable description URI. This could be fetched off-chain and stored for richer proposal display.
- **Proposal state computation**: The `ProposalState` enum has 9 states. Most are time-based and can be computed on-the-fly from stored timestamps + config. Only `Executed` and `Dropped` need explicit tracking from events.
