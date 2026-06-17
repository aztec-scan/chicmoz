import { z } from "zod";
import { frSchema, frTimestampSchema } from "../aztec/utils.js";
import { ethAddressSchema } from "../index.js";

export const chicmozL1L2BlockProposedSchema = z.object({
  l1ContractAddress: ethAddressSchema,
  l2BlockNumber: z.coerce.bigint(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1BlockHash: z.string().startsWith("0x"),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  isFinalized: z.boolean().default(false),
  archive: frSchema,
});

export type ChicmozL1L2BlockProposed = z.infer<
  typeof chicmozL1L2BlockProposedSchema
>;

export const chicmozL1L2ProofVerifiedSchema = z.object({
  l1ContractAddress: ethAddressSchema,
  l2BlockNumber: z.coerce.bigint(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1BlockHash: z.string().startsWith("0x"),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  isFinalized: z.boolean().default(false),
  proverId: ethAddressSchema,
});

export type ChicmozL1L2ProofVerified = z.infer<
  typeof chicmozL1L2ProofVerifiedSchema
>;

export const chicmozL1GenericContractEventSchema = z.object({
  id: z.string().uuid().optional(),
  eventName: z.string(),
  // TODO: does some events have bigints in args?
  eventArgs: z.record(z.unknown()).optional(),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1ContractAddress: z.string(),
  isFinalized: z.boolean().default(false),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
});

export type ChicmozL1GenericContractEvent = z.infer<
  typeof chicmozL1GenericContractEventSchema
>;

/**
 * Structured event emitted by FeeJuicePortal when fee juice is bridged from L1→L2.
 * Solidity signature: DepositToAztecPublic(bytes32 indexed to, uint256 amount, bytes32 secretHash, bytes32 key, uint256 index)
 */
export const chicmozL1FeeJuicePortalDepositSchema = z.object({
  // L1 context
  l1ContractAddress: z.string().startsWith("0x"),
  l1BlockNumber: z.coerce.bigint(),
  l1BlockHash: z.string().startsWith("0x"),
  l1BlockTimestamp: frTimestampSchema.optional().nullable(),
  l1TransactionHash: z.string().startsWith("0x").optional().nullable(),
  l1LogIndex: z.coerce.number().int().nonnegative().optional().nullable(),
  isFinalized: z.boolean().default(false),
  /** L1 address that called depositToAztecPublic (msg.sender on the portal tx). */
  l1Sender: z.string().startsWith("0x").optional().nullable(),
  // Event-specific fields
  /** L2 recipient address (bytes32 / Fr). */
  to: z.string().startsWith("0x"),
  /** Amount of fee juice (wei units, uint256). */
  amount: z.coerce.bigint().nonnegative(),
  secretHash: z.string().startsWith("0x"),
  /** Inbox message key (bytes32). */
  key: z.string().startsWith("0x"),
  /** Inbox leaf index (uint256). */
  index: z.coerce.bigint().nonnegative(),
});

export type ChicmozL1FeeJuicePortalDeposit = z.infer<
  typeof chicmozL1FeeJuicePortalDepositSchema
>;

/**
 * Per-hour bucket of L1 contract events. Sparse — buckets with zero events
 * are omitted; the consumer fills in the missing hours.
 */
export const chicmozL1ContractEventsHourlyBucketSchema = z.object({
  hourStartMs: z.coerce.number().int().nonnegative(),
  count: z.coerce.number().int().nonnegative(),
});
export const chicmozL1ContractEventsHourlyCountsSchema = z.array(
  chicmozL1ContractEventsHourlyBucketSchema,
);
export type ChicmozL1ContractEventsHourlyBucket = z.infer<
  typeof chicmozL1ContractEventsHourlyBucketSchema
>;
export type ChicmozL1ContractEventsHourlyCounts = z.infer<
  typeof chicmozL1ContractEventsHourlyCountsSchema
>;
