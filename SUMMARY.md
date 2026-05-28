below is summary with the diff between on-chain and what's in `ssh decem` (dev chicmoz)

DONE_WITH_CONCERNS
The API is wrong. On-chain yea/nay are not 0/0.
On-chain truth
Governance contract:
0x1102471Eb3378FEE427121c9EfcEa452E4B6B75e
Proposal 2
state: Executed
payload: 0x17582A82755B32132028e4410B491A2FdB3Ec380
proposer: 0x06Ef1DcF87E419C48B94a331B252819FADbD63ef
created: 1773370343
summedYea: 797550546610000000000000000
summedNay: 0
executed tx: 0x20a3b3b209e4290d2eae00bd64755b9d92703ad68cac9fe4e157967bd8617116
There are 7 VoteCast logs for proposal 2. The API returns [].
Proposal 3
computed state: Queued
cachedState in proposal struct: Pending
payload: 0xa156E3a14f45099ecdF9C6A393a118809C5d06e6
proposer: 0x06Ef1DcF87E419C48B94a331B252819FADbD63ef
created: 1778568755
summedYea: 709004000000000000000000000
summedNay: 0
There are 2 VoteCast logs for proposal 3:
amount 0
amount 709004000000000000000000000
The API only has the zero-amount vote.
Root cause
This is not “not voting = yea”.
Aztec governance only counts explicit VoteCast votes. The executed proposal had real yea votes on-chain.
The likely API/indexer bug is numeric overflow.
In Chicmoz, vote amounts and summed votes are stored as PostgreSQL bigint:
services/explorer-api/src/svcs/database/schema/l1/governance.ts
34: summedYea: bigint("summed_yea", { mode: "bigint" }).notNull()
35: summedNay: bigint("summed_nay", { mode: "bigint" }).notNull()
70: amount: bigint("amount", { mode: "bigint" }).notNull()
Migration confirms:
services/explorer-api/migrations/0000_redundant_cable.sql
487: "summed_yea" bigint NOT NULL
488: "summed_nay" bigint NOT NULL
528: "amount" bigint NOT NULL
Postgres bigint max is about 9.22e18.
These votes are around 7e26.
So nonzero governance votes cannot fit in the DB. That explains:

- proposal 2: all votes overflow, so API shows no votes and 0/0
- proposal 3: zero vote fits, nonzero vote overflows, so API shows one zero vote and 0/0
  Other missing/wrong API info
  The API also misses on-chain proposal state data:
- proposer should be 0x06Ef...63ef, not null
- configuration should be populated
- pendingThrough, activeThrough, queuedThrough, executableThrough should be derived from creation + config
- proposal 3 should show computed state Queued, not Pending
  Code reason:
  services/explorer-api/src/svcs/database/controllers/l1/governance/store.ts
  38: proposer: null
  39: governanceProposerAddress: null
  40: state: "Pending"
  42: summedYea: 0n
  43: summedNay: 0n
  44: configuration
  And:
  services/explorer-api/src/events/received/on-governance-events.ts
  50: // Fetch current governance config to freeze timeline
  51: // For now, store null config — a follow-up can fetch from Governance.getConfig()
  52: const configuration = null;
  Proposal state is only updated on executed/dropped events. It is not recomputed from getProposalState() for pending/active/queued/executable/rejected/expired.
  Fix direction

1. Change governance vote numeric columns from Postgres bigint to numeric(78,0) or text-backed decimal.
2. Recompute summedYea/summedNay from on-chain getProposal(proposalId).summedBallot, or backfill vote logs after schema fix.
3. Store proposer, full config, phase timestamps at proposal ingestion.
4. For list/detail, expose computed state from getProposalState(), not only cached/event-updated DB state.
   I did not modify files. Existing working tree already has unrelated changes.
