import { z } from "zod";
import {
  chicmozL2BlockFinalizationStatusSchema,
  hexStringSchema,
} from "../index.js";
import { frNumberSchema, frTimestampSchema } from "./utils.js";

export const uiBlockTableSchema = z.object({
  blockHash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  timestamp: frTimestampSchema,
  txEffectsLength: z.number(),
  blockStatus: chicmozL2BlockFinalizationStatusSchema,
});

export type UiBlockTable = z.infer<typeof uiBlockTableSchema>;

export const uiTxEffectTableSchema = z.object({
  blockNumber: z.coerce.bigint().nonnegative(),
  txHash: hexStringSchema,
  transactionFee: frNumberSchema,
  timestamp: frTimestampSchema,
});

export type UiTxEffectTable = z.infer<typeof uiTxEffectTableSchema>;
