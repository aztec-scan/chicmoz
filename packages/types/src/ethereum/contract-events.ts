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
