import { z } from "zod";
import { ethAddressSchema, hexStringSchema } from "../general.js";
import {
  chicmozL2BlockFinalizationStatusSchema,
  chicmozL2NativeBlockStatusSchema,
} from "./l2Block.js";
import { frDecimalStringSchema, frTimestampSchema } from "./utils.js";

export const uiBlockStatusFilterSchema = z.enum([
  "proposed",
  "checkpointed",
  "proven",
  "finalized",
  "unknown",
  "orphaned",
]);

export type UiBlockStatusFilter = z.infer<typeof uiBlockStatusFilterSchema>;

export const uiBlockTableSchema = z.object({
  blockHash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  timestamp: frTimestampSchema,
  txEffectsLength: z.number(),
  blockStatus: chicmozL2BlockFinalizationStatusSchema,
  nativeStatus: chicmozL2NativeBlockStatusSchema.optional(),
  // True when the block has been reorged out. The row should still be shown
  // (the design has an "orphaned" filter chip) but the StatusPill must
  // collapse to "orphaned" rather than its pre-orphan finalization status.
  orphan: z.boolean().default(false),
  // The block's L1 coinbase — surfaced from `globalVariables.coinbase` so
  // the table can show a truncated address cell without a follow-up call
  // to the block-detail endpoint. Field name matches the Aztec SDK and the
  // block-detail label; intentionally NOT named `proposer` because that
  // word collides with the validator's proposer ETH address concept.
  coinbase: ethAddressSchema.optional(),
});

export type UiBlockTable = z.infer<typeof uiBlockTableSchema>;

export const uiTxEffectTableSchema = z.object({
  blockNumber: z.coerce.bigint().nonnegative(),
  txHash: hexStringSchema,
  transactionFee: frDecimalStringSchema,
  timestamp: frTimestampSchema,
});

export type UiTxEffectTable = z.infer<typeof uiTxEffectTableSchema>;
