import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { generateEthAddressColumn, generateTimestampColumn } from "../utils.js";

// ── l1_governance_proposals ──────────────────────────────────────────────────

export const l1GovernanceProposalsTable = pgTable(
  "l1_governance_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: varchar("proposal_id", { length: 78 }).notNull(),
    payloadAddress: generateEthAddressColumn("payload_address").notNull(),
    proposer: generateEthAddressColumn("proposer"),
    governanceProposerAddress: generateEthAddressColumn(
      "governance_proposer_address",
    ),
    state: varchar("state").notNull().default("Pending"),
    createdAt: generateTimestampColumn("created_at").notNull(),
    pendingThrough: generateTimestampColumn("pending_through"),
    activeThrough: generateTimestampColumn("active_through"),
    queuedThrough: generateTimestampColumn("queued_through"),
    executableThrough: generateTimestampColumn("executable_through"),
    summedYea: bigint("summed_yea", { mode: "bigint" }).notNull(),
    summedNay: bigint("summed_nay", { mode: "bigint" }).notNull(),
    executedAt: generateTimestampColumn("executed_at"),
    droppedAt: generateTimestampColumn("dropped_at"),
    configuration: jsonb("configuration"),
    uri: varchar("uri"),
    metadata: jsonb("metadata"),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
    isFinalized: boolean("is_finalized").notNull().default(false),
  },
  (table) => ({
    proposalIdUnique: uniqueIndex("l1_gov_proposals_proposal_id_unique").on(
      table.proposalId,
    ),
    stateIdx: index("l1_gov_proposals_state_idx").on(table.state),
    createdAtIdx: index("l1_gov_proposals_created_at_idx").on(
      table.createdAt,
    ),
    payloadAddressIdx: index("l1_gov_proposals_payload_address_idx").on(
      table.payloadAddress,
    ),
  }),
);

// ── l1_governance_votes ──────────────────────────────────────────────────────

export const l1GovernanceVotesTable = pgTable(
  "l1_governance_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: varchar("proposal_id", { length: 78 }).notNull(),
    voter: generateEthAddressColumn("voter").notNull(),
    support: boolean("support").notNull(),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1TransactionHash: varchar("l1_transaction_hash").notNull(),
    l1LogIndex: bigint("l1_log_index", { mode: "number" }).notNull(),
    isFinalized: boolean("is_finalized").notNull().default(false),
  },
  (table) => ({
    proposalIdIdx: index("l1_gov_votes_proposal_id_idx").on(table.proposalId),
    voterIdx: index("l1_gov_votes_voter_idx").on(table.voter),
    voteLogUnique: uniqueIndex("l1_gov_votes_log_unique").on(
      table.l1TransactionHash,
      table.l1LogIndex,
      table.isFinalized,
    ),
  }),
);

// ── l1_governance_signals ────────────────────────────────────────────────────

export const l1GovernanceSignalsTable = pgTable(
  "l1_governance_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payloadAddress: generateEthAddressColumn("payload_address").notNull(),
    round: bigint("round", { mode: "bigint" }).notNull(),
    signaler: generateEthAddressColumn("signaler").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1TransactionHash: varchar("l1_transaction_hash").notNull(),
    l1LogIndex: bigint("l1_log_index", { mode: "number" }).notNull(),
    isFinalized: boolean("is_finalized").notNull().default(false),
  },
  (table) => ({
    payloadAddressIdx: index("l1_gov_signals_payload_address_idx").on(
      table.payloadAddress,
    ),
    roundIdx: index("l1_gov_signals_round_idx").on(table.round),
    signalerIdx: index("l1_gov_signals_signaler_idx").on(table.signaler),
    signalLogUnique: uniqueIndex("l1_gov_signals_log_unique").on(
      table.l1TransactionHash,
      table.l1LogIndex,
      table.isFinalized,
    ),
  }),
);

// ── l1_governance_payload_rounds ─────────────────────────────────────────────

export const l1GovernancePayloadRoundsTable = pgTable(
  "l1_governance_payload_rounds",
  {
    payloadAddress: generateEthAddressColumn("payload_address").notNull(),
    round: bigint("round", { mode: "bigint" }).notNull(),
    signalCount: bigint("signal_count", { mode: "bigint" }).notNull(),
    isSubmittable: boolean("is_submittable").notNull().default(false),
    isSubmitted: boolean("is_submitted").notNull().default(false),
    winningPayload: boolean("winning_payload").notNull().default(false),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.payloadAddress, table.round] }),
  }),
);

// ── l1_governance_configurations ─────────────────────────────────────────────

export const l1GovernanceConfigurationsTable = pgTable(
  "l1_governance_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configuration: jsonb("configuration").notNull(),
    updatedAt: generateTimestampColumn("updated_at").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
  },
);

// ── l1_governance_proposer_history ───────────────────────────────────────────

export const l1GovernanceProposerHistoryTable = pgTable(
  "l1_governance_proposer_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    governanceProposerAddress: generateEthAddressColumn(
      "governance_proposer_address",
    ).notNull(),
    updatedAt: generateTimestampColumn("updated_at").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
  },
);

// ── Relations ────────────────────────────────────────────────────────────────

export const l1GovernanceProposalsRelations = relations(
  l1GovernanceProposalsTable,
  ({ many }) => ({
    votes: many(l1GovernanceVotesTable),
  }),
);

export const l1GovernanceVotesRelations = relations(
  l1GovernanceVotesTable,
  ({ one }) => ({
    proposal: one(l1GovernanceProposalsTable, {
      fields: [l1GovernanceVotesTable.proposalId],
      references: [l1GovernanceProposalsTable.proposalId],
    }),
  }),
);
