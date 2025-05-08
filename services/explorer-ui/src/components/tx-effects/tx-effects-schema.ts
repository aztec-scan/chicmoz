import { type UiBlockTable, type ChicmozL2TxEffect } from "@chicmoz-pkg/types";
import { z } from "zod";

export type TxEffectTableSchema = z.infer<typeof txEffectSchema>;

export const getTxEffectTableObj = (
  txEffect: ChicmozL2TxEffect,
  block: UiBlockTable,
): TxEffectTableSchema => {
  return txEffectSchema.parse({
    txHash: txEffect.txHash,
    transactionFee: txEffect.transactionFee,
    blockNumber: block.height,
    timestamp: block.timestamp,
  });
};

const txEffectSchema = z.object({
  txHash: z.string(),
  transactionFee: z.number(),
  blockNumber: z.coerce.number(),
  timestamp: z.number(),
});
