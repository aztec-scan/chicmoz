import {
  type ChicmozL2TxEffect,
  type UiTxEffectTable,
  type ChicmozL2BlockLight,
} from "@chicmoz-pkg/types";
import { z } from "zod";

export type TxEffectTableSchema = z.infer<typeof txEffectSchema>;

export const getTxEffectTableObj = (
  txEffect: ChicmozL2TxEffect,
  block: ChicmozL2BlockLight,
): TxEffectTableSchema => {
  return txEffectSchema.parse({
    txHash: txEffect.txHash,
    transactionFee: txEffect.transactionFee,
    blockNumber: block.height,
    timestamp: block.header.globalVariables.timestamp,
  });
};

export const getTableTxEffectObj = (txEffects?: UiTxEffectTable[]) => {
  if (!txEffects) {
    return undefined;
  }
  return txEffects.map((txEffect) => txEffectSchema.parse(txEffect));
};

const txEffectSchema = z.object({
  txHash: z.string(),
  transactionFee: z.number(),
  blockNumber: z.coerce.number(),
  timestamp: z.number(),
});
