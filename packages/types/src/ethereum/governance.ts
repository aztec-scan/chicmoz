import { z } from "zod";
import { frTimestampSchema } from "../aztec/utils.js";
import { ethAddressSchema } from "../index.js";

// ── Governance Proposal Events ──────────────────────────────────────────────

export const chicmozL1GovernanceProposedSchema = z.object({
  proposalId: z.coerce.bigint(),
  proposalAddress: ethAddressSchema,
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

// ── Governance API Response Schemas (database rows) ──────────────────────────

/** A governance proposal as stored in the DB and returned by the API. */
export const chicmozL1GovernanceProposalSchema = z.object({
  id: z.string().uuid().optional(),
  proposalId: z.string(),
  payloadAddress: ethAddressSchema,
  proposer: ethAddressSchema.nullable(),
  governanceProposerAddress: ethAddressSchema.nullable(),
  state: z.string(),
  createdAt: z.coerce.date(),
  pendingThrough: z.coerce.date().nullable().optional(),
  activeThrough: z.coerce.date().nullable().optional(),
  queuedThrough: z.coerce.date().nullable().optional(),
  executableThrough: z.coerce.date().nullable().optional(),
  summedYea: z.coerce.bigint(),
  summedNay: z.coerce.bigint(),
  executedAt: z.coerce.date().nullable().optional(),
  droppedAt: z.coerce.date().nullable().optional(),
  configuration: z.record(z.unknown()).nullable().optional(),
  uri: z.string().nullable().optional(),
  metadata: z.unknown().nullable().optional(),
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
