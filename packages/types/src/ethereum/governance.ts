import { z } from "zod";
import { frTimestampSchema } from "../aztec/utils.js";

const ethAddressSchema = z
  .string()
  .length(42)
  .regex(/^0x[0-9a-fA-F]+$/);

// ── Governance Proposal States ───────────────────────────────────────────────

/** Valid lifecycle states for a governance proposal. */
export const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Queued",
  "Executable",
  "Rejected",
  "Executed",
  "Droppable",
  "Dropped",
  "Expired",
] as const;
export type ProposalState = (typeof PROPOSAL_STATES)[number];

export const proposalStateSchema = z.enum(PROPOSAL_STATES);

export const governanceProposalConfigurationSchema = z.object({
  votingDelay: z.coerce.bigint(),
  votingDuration: z.coerce.bigint(),
  executionDelay: z.coerce.bigint(),
  gracePeriod: z.coerce.bigint(),
  quorum: z.coerce.bigint(),
  requiredYeaMargin: z.coerce.bigint(),
  minimumVotes: z.coerce.bigint(),
});

// ── Governance Proposal Events ──────────────────────────────────────────────

export const chicmozL1GovernanceProposedSchema = z.object({
  proposalId: z.coerce.bigint(),
  proposalAddress: ethAddressSchema,
  originalPayloadAddress: ethAddressSchema.nullable().optional(),
  proposer: ethAddressSchema.nullable().optional(),
  governanceProposerAddress: ethAddressSchema.nullable().optional(),
  state: proposalStateSchema.optional(),
  cachedState: proposalStateSchema.optional(),
  pendingThrough: frTimestampSchema.optional().nullable(),
  activeThrough: frTimestampSchema.optional().nullable(),
  queuedThrough: frTimestampSchema.optional().nullable(),
  executableThrough: frTimestampSchema.optional().nullable(),
  summedYea: z.coerce.bigint().optional(),
  summedNay: z.coerce.bigint().optional(),
  snapshotTotalPower: z.coerce.bigint().optional().nullable(),
  votesNeeded: z.coerce.bigint().optional().nullable(),
  configuration: governanceProposalConfigurationSchema.nullable().optional(),
  uri: z.string().nullable(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceProposed = z.infer<
  typeof chicmozL1GovernanceProposedSchema
>;

export const chicmozL1GovernanceVoteCastSchema = z.object({
  proposalId: z.coerce.bigint(),
  voter: ethAddressSchema,
  support: z.boolean(),
  amount: z.coerce.bigint(),
  state: proposalStateSchema.optional(),
  cachedState: proposalStateSchema.optional(),
  summedYea: z.coerce.bigint().optional(),
  summedNay: z.coerce.bigint().optional(),
  snapshotTotalPower: z.coerce.bigint().optional().nullable(),
  votesNeeded: z.coerce.bigint().optional().nullable(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceVoteCast = z.infer<
  typeof chicmozL1GovernanceVoteCastSchema
>;

export const chicmozL1GovernanceProposalExecutedSchema = z.object({
  proposalId: z.coerce.bigint(),
  state: proposalStateSchema.optional(),
  cachedState: proposalStateSchema.optional(),
  summedYea: z.coerce.bigint().optional(),
  summedNay: z.coerce.bigint().optional(),
  snapshotTotalPower: z.coerce.bigint().optional().nullable(),
  votesNeeded: z.coerce.bigint().optional().nullable(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceProposalExecuted = z.infer<
  typeof chicmozL1GovernanceProposalExecutedSchema
>;

export const chicmozL1GovernanceProposalDroppedSchema = z.object({
  proposalId: z.coerce.bigint(),
  state: proposalStateSchema.optional(),
  cachedState: proposalStateSchema.optional(),
  summedYea: z.coerce.bigint().optional(),
  summedNay: z.coerce.bigint().optional(),
  snapshotTotalPower: z.coerce.bigint().optional().nullable(),
  votesNeeded: z.coerce.bigint().optional().nullable(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceProposalDropped = z.infer<
  typeof chicmozL1GovernanceProposalDroppedSchema
>;

// ── GovernanceProposer (Signaling) Events ────────────────────────────────────

export const chicmozL1GovernanceSignalCastSchema = z.object({
  payloadAddress: ethAddressSchema,
  round: z.coerce.bigint(),
  signaler: ethAddressSchema,
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceSignalCast = z.infer<
  typeof chicmozL1GovernanceSignalCastSchema
>;

export const chicmozL1GovernancePayloadSubmittableSchema = z.object({
  payloadAddress: ethAddressSchema,
  round: z.coerce.bigint(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernancePayloadSubmittable = z.infer<
  typeof chicmozL1GovernancePayloadSubmittableSchema
>;

export const chicmozL1GovernancePayloadSubmittedSchema = z.object({
  payloadAddress: ethAddressSchema,
  round: z.coerce.bigint(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernancePayloadSubmitted = z.infer<
  typeof chicmozL1GovernancePayloadSubmittedSchema
>;

// ── Governance Configuration / Proposer History Events ───────────────────────

export const chicmozL1GovernanceConfigUpdatedSchema = z.object({
  configuration: z.record(z.unknown()),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceConfigUpdated = z.infer<
  typeof chicmozL1GovernanceConfigUpdatedSchema
>;

export const chicmozL1GovernanceProposerUpdatedSchema = z.object({
  governanceProposerAddress: ethAddressSchema,
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceProposerUpdated = z.infer<
  typeof chicmozL1GovernanceProposerUpdatedSchema
>;

export const governanceGithubPrSchema = z.object({
  org: z.string(),
  repo: z.string(),
  number: z.coerce.number().int().positive(),
  title: z.string(),
  merged: z.boolean(),
  url: z.string().url(),
});

export const governanceProposalMetadataSchema = z.object({
  title: z.string().nullable().optional(),
  github_pr: governanceGithubPrSchema.nullable().optional(),
  forum_link: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

// ── Governance API Response Schemas (database rows) ──────────────────────────

/** A governance proposal as stored in the DB and returned by the API. */
export const chicmozL1GovernanceProposalSchema = z.object({
  id: z.string().uuid().optional(),
  proposalId: z.string(),
  payloadAddress: ethAddressSchema,
  originalPayloadAddress: ethAddressSchema.nullable().optional(),
  proposer: ethAddressSchema.nullable(),
  governanceProposerAddress: ethAddressSchema.nullable(),
  state: proposalStateSchema,
  cachedState: proposalStateSchema.nullable().optional(),
  createdAt: z.coerce.date(),
  pendingThrough: z.coerce.date().nullable().optional(),
  activeThrough: z.coerce.date().nullable().optional(),
  queuedThrough: z.coerce.date().nullable().optional(),
  executableThrough: z.coerce.date().nullable().optional(),
  summedYea: z.coerce.bigint(),
  summedNay: z.coerce.bigint(),
  votesCast: z.coerce.bigint().optional(),
  snapshotTotalPower: z.coerce.bigint().nullable().optional(),
  votesNeeded: z.coerce.bigint().nullable().optional(),
  executedAt: z.coerce.date().nullable().optional(),
  droppedAt: z.coerce.date().nullable().optional(),
  configuration: governanceProposalConfigurationSchema.nullable().optional(),
  uri: z.string().nullable().optional(),
  metadata: governanceProposalMetadataSchema.nullable().optional(),
  title: z.string().nullable().optional(),
  forum_link: z.string().nullable().optional(),
  github_pr: governanceGithubPrSchema.nullable().optional(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: z.coerce.date(),
  l1TransactionHash: z.string().nullable().optional(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceProposal = z.infer<
  typeof chicmozL1GovernanceProposalSchema
>;

/** A single vote on a governance proposal. */
export const chicmozL1GovernanceVoteSchema = z.object({
  id: z.string().uuid().optional(),
  proposalId: z.string(),
  voter: ethAddressSchema,
  support: z.boolean(),
  amount: z.coerce.bigint(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: z.coerce.date(),
  l1TransactionHash: z.string(),
  l1LogIndex: z.coerce.number(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceVote = z.infer<
  typeof chicmozL1GovernanceVoteSchema
>;

/** A governance signal cast by a signaler in a round. */
export const chicmozL1GovernanceSignalSchema = z.object({
  id: z.string().uuid().optional(),
  payloadAddress: ethAddressSchema,
  round: z.coerce.bigint(),
  signaler: ethAddressSchema,
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: z.coerce.date(),
  l1TransactionHash: z.string(),
  l1LogIndex: z.coerce.number(),
  isFinalized: z.boolean().default(false),
});
export type ChicmozL1GovernanceSignal = z.infer<
  typeof chicmozL1GovernanceSignalSchema
>;

/** Payload round tracking entry. */
export const chicmozL1GovernancePayloadRoundSchema = z.object({
  payloadAddress: ethAddressSchema,
  round: z.coerce.bigint(),
  signalCount: z.coerce.bigint(),
  isSubmittable: z.boolean(),
  isSubmitted: z.boolean(),
  winningPayload: z.boolean(),
});
export type ChicmozL1GovernancePayloadRound = z.infer<
  typeof chicmozL1GovernancePayloadRoundSchema
>;

/** A governance configuration snapshot. */
export const chicmozL1GovernanceConfigurationSchema = z.object({
  id: z.string().uuid().optional(),
  configuration: z.record(z.unknown()),
  updatedAt: z.coerce.date(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: z.coerce.date(),
});
export type ChicmozL1GovernanceConfiguration = z.infer<
  typeof chicmozL1GovernanceConfigurationSchema
>;

/** A governance proposer history entry. */
export const chicmozL1GovernanceProposerHistorySchema = z.object({
  id: z.string().uuid().optional(),
  governanceProposerAddress: ethAddressSchema,
  updatedAt: z.coerce.date(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string(),
  l1BlockTimestamp: z.coerce.date(),
});
export type ChicmozL1GovernanceProposerHistory = z.infer<
  typeof chicmozL1GovernanceProposerHistorySchema
>;
