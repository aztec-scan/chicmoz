import {
  type ChicmozL2TxEffectDeluxe,
  type ChicmozL2BlockLight,
  type ChicmozL2TxEffect,
} from "@chicmoz-pkg/types";
import { z } from "zod";

export type TxEffectTableSchema = z.infer<typeof txEffectSchema>;

export const getTxEffectTableObj = (
  txEffect: ChicmozL2TxEffectDeluxe | ChicmozL2TxEffect,
  block?: ChicmozL2BlockLight,
): TxEffectTableSchema => {
  // If we have a ChicmozL2TxEffectDeluxe (with timestamp) and no block
  if (!block && "timestamp" in txEffect) {
    return txEffectSchema.parse({
      txHash: txEffect.txHash,
      transactionFee: txEffect.transactionFee,
      blockNumber: txEffect.privateLogs,
      timestamp: txEffect.timestamp,
    });
  }

  // If we have a block, use the block data (original approach)
  if (block) {
    return txEffectSchema.parse({
      txHash: txEffect.txHash,
      transactionFee: txEffect.transactionFee,
      blockNumber: block.height,
      timestamp: block.header.globalVariables.timestamp,
    });
  }

  // Fallback for basic ChicmozL2TxEffect without block
  throw new Error("Block data required for basic ChicmozL2TxEffect objects");
};

const txEffectSchema = z.object({
  txHash: z.string(),
  transactionFee: z.number(),
  blockNumber: z.coerce.number(),
  timestamp: z.number(),
});
