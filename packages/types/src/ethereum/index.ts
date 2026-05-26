import { z } from "zod";
import { ethAddressSchema } from "../general.js";
export * from "./contract-events.js";

// NOTE: explaination copied from aztec-packages: l1-contracts/src/core/interfaces/IStaking.sol
// None -> Does not exist in our setup
// Validating -> Participating as validator
// Living -> Not participating as validator, but have funds in setup,
// 			 hit if slashes and going below the minimum
// Exiting -> In the process of exiting the system
export enum L1L2ValidatorStatus {
  NONE,
  VALIDATING,
  LIVING,
  EXITING,
}

const timestampSchema = z.coerce.date();
const keyChangedSchema = z.coerce.string();
const newValueSchema = z.coerce.string();

export const chicmozL1L2ValidatorSchema = z.object({
  rollupAddress: ethAddressSchema,
  attester: ethAddressSchema,
  stake: z.coerce.bigint().nonnegative(), // TODO: this is not Fr but it might as well be. It is a uint256
  withdrawer: ethAddressSchema,
  proposer: ethAddressSchema,
  status: z.nativeEnum(L1L2ValidatorStatus),
  // NOTE: we could use createdAt and updatedAt, but I want to emphasize that this is the first time we saw this validator. It can be way off from the actual creation time (on chain).
  firstSeenAt: z.number().default(() => new Date().getTime()),
  latestSeenChangeAt: z.number().default(() => new Date().getTime()),
});

export type ChicmozL1L2Validator = z.infer<typeof chicmozL1L2ValidatorSchema>;

export const chicmozL1L2ValidatorTotalsSchema = z.object({
  total: z.number().nonnegative(),
  validating: z.number().nonnegative(),
  nonValidating: z.number().nonnegative(),
  statusCounts: z.record(z.string(), z.number().nonnegative()),
  // Stake aggregates are computed server-side so the UI doesn't need to load
  // every validator to render the strip. Optional for backwards-compat with
  // older API responses; current backend always populates them.
  totalStake: z.coerce.bigint().nonnegative().optional(),
  validatingStake: z.coerce.bigint().nonnegative().optional(),
  maxStake: z.coerce.bigint().nonnegative().optional(),
  stakeByStatus: z
    .record(z.string(), z.coerce.bigint().nonnegative())
    .optional(),
});

export type ChicmozL1L2ValidatorTotals = z.infer<
  typeof chicmozL1L2ValidatorTotalsSchema
>;

export const chicmozL1L2ValidatorHistoryEntrySchema = z.tuple([
  timestampSchema,
  keyChangedSchema,
  newValueSchema,
]);

export type ChicmozL1L2ValidatorHistoryEntry = z.infer<
  typeof chicmozL1L2ValidatorHistoryEntrySchema
>;

export const chicmozL1L2ValidatorHistorySchema = z.array(
  chicmozL1L2ValidatorHistoryEntrySchema,
);

export type ChicmozL1L2ValidatorHistory = z.infer<
  typeof chicmozL1L2ValidatorHistorySchema
>;
