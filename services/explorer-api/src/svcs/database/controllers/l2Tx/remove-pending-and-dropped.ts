import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL2TxEffect } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { l2Tx } from "../../../database/schema/l2tx/index.js";
import { removeDroppedTxByHash } from "../../controllers/dropped-tx/remove.js";

export const removePendingAndDroppedTx = async (
  txEffects: ChicmozL2TxEffect[],
): Promise<void> => {
  return await db().transaction(async (dbTx) => {
    for (const txEffect of Object.values(txEffects)) {
      const tx = await dbTx
        .delete(l2Tx)
        .where(eq(l2Tx.txHash, txEffect.txHash))
        .returning();
      if (!tx) {
        continue;
      }
      logger.info(`🕐🔥 deleted pending tx ${txEffect.txHash}`);

      try {
        await removeDroppedTxByHash(txEffect.txHash);
      } catch (e) {
        logger.error(
          `Error removing dropped tx ${txEffect.txHash}: ${(e as Error).stack}`,
        );
      }

      if (tx[0]?.birthTimestamp) {
        await dbTx
          .update(l2Tx)
          .set({
            birthTimestamp: tx[0].birthTimestamp,
          })
          .where(eq(l2Tx.txHash, txEffect.txHash));
      }
    }
  });
};
