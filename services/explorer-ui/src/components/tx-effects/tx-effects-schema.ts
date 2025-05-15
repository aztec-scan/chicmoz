import { type UiTxEffectTable } from "@chicmoz-pkg/types";
import { z } from "zod";

export type TxEffectTableSchema = z.infer<typeof txEffectSchema>;

export const getTxEffectTableObj = (
  txEffect?: UiTxEffectTable,
): TxEffectTableSchema => {
  if (!txEffect) {
    return {
      txHash: "",
      transactionFee: 0,
      blockNumber: 0n,
      timestamp: 0,
    };
  }
  return txEffectSchema.parse({
    txHash: txEffect.txHash,
    transactionFee: txEffect.transactionFee,
    blockNumber: txEffect.blockNumber,
    timestamp: txEffect.timestamp,
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
  blockNumber: z.coerce.bigint(),
  timestamp: z.number(),
});
