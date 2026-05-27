# PLAN: Compute Governance Proposal State at Query Time

## Problem

The Aztec `Governance.sol` contract does **not** emit state-transition events (no `ProposalQueued`, `ProposalActive`, etc.). It only emits 4 events:

- `Proposed` — creates the proposal
- `VoteCast` — records a vote
- `ProposalExecuted` — marks as executed
- `ProposalDropped` — marks as dropped

On-chain, `getProposalState()` computes the state **dynamically** based on timestamps and vote results:

```
currentTime ≤ pendingThrough()          → Pending
currentTime ≤ activeThrough()           → Active
voteTabulation() != Accepted            → Rejected
currentTime ≤ queuedThrough()           → Queued
currentTime ≤ executableThrough()       → Executable
otherwise                               → Expired
```

Currently the DB stores `state` as a static column (default `"Pending"`) and the timeline columns (`pendingThrough`, `activeThrough`, `queuedThrough`, `executableThrough`) are **never populated**. So proposals stay `"Pending"` forever until an `Executed`/`Dropped` event fires.

## Approach

Fetch timeline data from the Governance contract when the `Proposed` event arrives, store it in the DB, then compute the logical state at query time.

---

## Phase 1: Enrich `Proposed` event with timeline data

### 1.1 ethereum-listener: Fetch `getProposal()` on `Proposed` event

**File:** `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts`

In `proposedOnLogs`, after fetching the URI, also call `getProposal(proposalId)` on the Governance contract to retrieve:

- `config.votingDelay`, `config.votingDuration`, `config.executionDelay`, `config.gracePeriod`
- `config.quorum`, `config.requiredYeaMargin`, `config.minimumVotes`
- `creation` timestamp
- `proposer` address

The Governance contract address is already resolved in `getL1Contracts()` (via `registry.getGovernance()`). The `proposedOnLogs` callback currently uses `getPublicHttpClient().readContract()` for the URI call — use the same pattern with `GovernanceAbi`.

Add these fields to the `ChicmozL1GovernanceProposed` schema and emitted event payload:

```ts
// New fields on the emitted event:
proposer: address | null;
votingDelay: bigint; // seconds
votingDuration: bigint; // seconds
executionDelay: bigint; // seconds
gracePeriod: bigint; // seconds
quorum: bigint; // 1e18 precision
requiredYeaMargin: bigint; // 1e18 precision
minimumVotes: bigint;
```

**Risk:** `getProposal()` may revert for very old proposals if the contract was upgraded. Wrap in try/catch, log a warning, and proceed with nulls — the state computation will gracefully degrade.

### 1.2 types: Extend `ChicmozL1GovernanceProposed` schema

**File:** `packages/types/src/ethereum/governance.ts`

Add the new fields to `chicmozL1GovernanceProposedSchema`:

```ts
proposer: ethAddressSchema.nullable().optional(),
votingDelay: z.coerce.bigint().optional().nullable(),
votingDuration: z.coerce.bigint().optional().nullable(),
executionDelay: z.coerce.bigint().optional().nullable(),
gracePeriod: z.coerce.bigint().optional().nullable(),
quorum: z.coerce.bigint().optional().nullable(),
requiredYeaMargin: z.coerce.bigint().optional().nullable(),
minimumVotes: z.coerce.bigint().optional().nullable(),
```

### 1.3 explorer-api DB: Store timeline columns on insert

**File:** `services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts`

In `storeGovernanceProposed`, populate the already-existing DB columns:

```ts
proposer: event.proposer ?? null,
pendingThrough: event.l1BlockTimestamp + event.votingDelay,
activeThrough: event.l1BlockTimestamp + event.votingDelay + event.votingDuration,
queuedThrough: /* computed from activeThrough + executionDelay */,
executableThrough: /* computed from queuedThrough + gracePeriod */,
```

The columns already exist in the schema (`services/explorer-api/src/svcs/database/schema/l1/governance.ts`):

- `pendingThrough`, `activeThrough`, `queuedThrough`, `executableThrough` — all `generateTimestampColumn()` (nullable)
- `proposer` — already exists as `generateEthAddressColumn("proposer")`

### 1.4 Backfill existing proposals (one-time migration)

For proposals already in the DB with null timeline columns, create a backfill script that:

1. Queries all proposals where `pendingThrough IS NULL`
2. Calls `getProposal(proposalId)` for each
3. Updates the timeline columns

This can be a simple script under `services/explorer-api/src/scripts/` or run manually via psql.

---

## Phase 2: Compute state at query time

### 2.1 types: Add `computeProposalState()` utility

**File:** `packages/types/src/ethereum/governance.ts` (new file or add to existing)

Create a pure function that computes the logical state:

```ts
export function computeProposalState(
  proposal: {
    state: ProposalState; // cached: "Pending", "Executed", "Dropped"
    pendingThrough: Date | null;
    activeThrough: Date | null;
    queuedThrough: Date | null;
    executableThrough: Date | null;
    summedYea: bigint;
    summedNay: bigint;
    quorum: bigint | null;
    requiredYeaMargin: bigint | null;
    minimumVotes: bigint | null;
  },
  now?: Date,
): ProposalState {
  // Stable states are final
  if (proposal.state === "Executed" || proposal.state === "Dropped") {
    return proposal.state;
  }

  // Missing timeline data — fall back to cached state
  if (
    !proposal.pendingThrough ||
    !proposal.activeThrough ||
    !proposal.queuedThrough ||
    !proposal.executableThrough
  ) {
    return proposal.state;
  }

  const currentTime = (now ?? new Date()).getTime();
  const pendingThrough = proposal.pendingThrough.getTime();
  const activeThrough = proposal.activeThrough.getTime();
  const queuedThrough = proposal.queuedThrough.getTime();
  const executableThrough = proposal.executableThrough.getTime();

  if (currentTime <= pendingThrough) return "Pending";
  if (currentTime <= activeThrough) return "Active";

  // Vote tabulation
  if (proposal.quorum && proposal.requiredYeaMargin && proposal.minimumVotes) {
    const accepted = isVoteAccepted(proposal);
    if (!accepted) return "Rejected";
  }

  if (currentTime <= queuedThrough) return "Queued";
  if (currentTime <= executableThrough) return "Executable";
  return "Expired";
}
```

The `isVoteAccepted()` helper replicates the on-chain `voteTabulation()` logic:

```ts
function isVoteAccepted(proposal: {...}): boolean {
  const totalPower = /* need to fetch or store totalPowerAt(pendingThrough) */;
  // For v1, simplify: if summedYea + summedNay > 0 and summedYea > summedNay, accept
  // A follow-up can store totalPowerAt snapshot for exact on-chain parity
  return proposal.summedYea > proposal.summedNay;
}
```

**Note on vote tabulation:** Exact on-chain parity requires `totalPowerAt(pendingThrough)` which changes over time. For v1, use a simplified check (yea > nay with some votes cast). The state will be correct for the common cases. A follow-up can add a `totalPowerAtPending` column if exact parity is needed.

### 2.2 explorer-api: Apply state computation in the query

**File:** `services/explorer-api/src/svcs/database/controllers/l1/governance/queries.ts`

In `getProposals()` and `getProposalById()`, after fetching rows from the DB, map over results and compute the logical state:

```ts
import { computeProposalState } from "@chicmoz-pkg/types";

export const getProposals = async (params?: {...}) => {
  const rows = await db().select()...;
  return rows.map(row => ({
    ...row,
    state: computeProposalState({
      state: row.state,
      pendingThrough: row.pendingThrough,
      activeThrough: row.activeThrough,
      queuedThrough: row.queuedThrough,
      executableThrough: row.executableThrough,
      summedYea: BigInt(row.summedYea),
      summedNay: BigInt(row.summedNay),
      quorum: row.quorum,
      requiredYeaMargin: row.requiredYeaMargin,
      minimumVotes: row.minimumVotes,
    }),
  }));
};
```

### 2.3 DB schema: Add columns for vote tabulation

**File:** `services/explorer-api/src/svcs/database/schema/l1/governance.ts`

Add columns needed for vote tabulation:

```ts
quorum: bigint("quorum", { mode: "bigint" }),
requiredYeaMargin: bigint("required_yea_margin", { mode: "bigint" }),
minimumVotes: bigint("minimum_votes", { mode: "bigint" }),
```

These need a DB migration.

---

## Phase 3: Wire it through

### 3.1 explorer-api: Flatten metadata into response

The `metadata` JSONB column stores `{ title, github_pr, forum_link, description }` from `resolvePayloadMetadata()`. The API returns raw rows, so these are nested under `metadata`. The UI expects them as top-level fields.

**File:** `services/explorer-api/src/svcs/database/controllers/l1/governance/queries.ts`

After computing state, also flatten metadata:

```ts
return rows.map(row => {
  const meta = (row.metadata as Record<string, unknown> | null) ?? {};
  return {
    ...row,
    title: (meta?.title as string | null) ?? null,
    forum_link: (meta?.forum_link as string | null) ?? null,
    github_pr: (meta?.github_pr as Record<string, unknown> | null) ?? null,
    state: computeProposalState({...}),
  };
});
```

### 3.2 Run DB migration

Add a Drizzle migration for the new columns (`quorum`, `requiredYeaMargin`, `minimumVotes`).

---

## File Change Summary

| File                                                                              | Change                                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/types/src/ethereum/governance.ts`                                       | Add fields to `ChicmozL1GovernanceProposedSchema`, add `computeProposalState()` |
| `services/ethereum-listener/src/network-client/contracts/callbacks/governance.ts` | Fetch `getProposal()` + `totalPowerAt()` in `proposedOnLogs`, emit new fields   |
| `services/explorer-api/src/svcs/database/schema/l1/governance.ts`                 | Add `quorum`, `requiredYeaMargin`, `minimumVotes` columns                       |
| `services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts`      | Store timeline columns + vote config on insert                                  |
| `services/explorer-api/src/svcs/database/controllers/l1/governance/queries.ts`    | Compute state at query time, flatten metadata                                   |
| `services/explorer-api/src/svcs/database/migrations/`                             | New migration for vote config columns                                           |
| (backfill script)                                                                 | One-time script to populate timeline for existing proposals                     |

## Risks & Mitigations

| Risk                                                                   | Mitigation                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `getProposal()` reverts for old proposals                              | Try/catch, log warning, proceed with nulls; state falls back to cached   |
| `totalPowerAt()` changes over time, making vote tabulation approximate | V1 uses simplified check; can add `totalPowerAtPending` snapshot later   |
| DB migration on production                                             | Standard Drizzle migration, tested on staging first                      |
| Performance: state computed per-row on every query                     | Negligible — pure JS, no I/O. Can memoize if needed later                |
| `getProposal()` call adds latency to event processing                  | Single eth_call, ~100ms. Already doing one for `getURI()`. Non-blocking. |
