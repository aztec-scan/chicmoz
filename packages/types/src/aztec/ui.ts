import { z } from "zod";
import {
  chicmozL2BlockFinalizationStatusSchema,
  ethAddressSchema,
  hexStringSchema,
} from "../index.js";
import { frDecimalStringSchema, frTimestampSchema } from "./utils.js";

export const uiBlockTableSchema = z.object({
  blockHash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  timestamp: frTimestampSchema,
  txEffectsLength: z.number(),
  blockStatus: chicmozL2BlockFinalizationStatusSchema,
  // True when the block has been reorged out. The row should still be shown
  // (the design has an "orphaned" filter chip) but the StatusPill must
  // collapse to "orphaned" rather than its pre-orphan finalization status.
  orphan: z.boolean().default(false),
  // L1 coinbase / proposer of the block — surfaced from `globalVariables`
  // so the table can show a truncated address cell without a follow-up
  // request to the block-detail endpoint.
  proposer: ethAddressSchema.optional(),
});

export type UiBlockTable = z.infer<typeof uiBlockTableSchema>;

export const uiTxEffectTableSchema = z.object({
  blockNumber: z.coerce.bigint().nonnegative(),
  txHash: hexStringSchema,
  transactionFee: frDecimalStringSchema,
  timestamp: frTimestampSchema,
});

export type UiTxEffectTable = z.infer<typeof uiTxEffectTableSchema>;
