import { type ChicmozL2TxEffect } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { l2Tx } from "../../../database/schema/l2tx/index.js";
import { logger } from "../../../../logger.js";

export const replaceTxsWithTxEffects = async (
  txEffects: ChicmozL2TxEffect[]
): Promise<void> => {
  return await db().transaction(async (dbTx) => {
    for (const txEffect of Object.values(txEffects)) {
      const tx = await dbTx
        .delete(l2Tx)
        .where(eq(l2Tx.hash, txEffect.txHash))
        .returning();
      if (!tx) {continue;}
      logger.info(`🕐🔥 Replacing tx with txEffect: ${txEffect.txHash}, and ensuring no dropped txs are affected`);
      if (tx[0]?.birthTimestamp) {
        await dbTx
          .update(l2Tx)
          .set({
            birthTimestamp: tx[0].birthTimestamp,
          })
          .where(eq(l2Tx.hash, txEffect.txHash));
      }
    }
  });
};
