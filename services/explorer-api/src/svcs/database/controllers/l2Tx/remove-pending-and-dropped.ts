import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL2TxEffect } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { l2Tx } from "../../../database/schema/l2tx/index.js";
import { txEffect } from "../../../database/schema/l2block/body.js";
import { removeDroppedTxByHash } from "../../controllers/dropped-tx/remove.js";

export const removePendingAndDroppedTx = async (
  txEffects: ChicmozL2TxEffect[],
): Promise<void> => {
  return await db().transaction(async (dbTx) => {
    for (const txEffectRow of Object.values(txEffects)) {
      const deleted = await dbTx
        .delete(l2Tx)
        .where(eq(l2Tx.txHash, txEffectRow.txHash))
        .returning();

      if (!deleted || deleted.length === 0) {
        continue;
      }

      logger.info(`🕐🔥 deleted pending tx ${txEffectRow.txHash}`);

      const pendingTx = deleted[0];

      // Copy fee/identity fields from the deleted pending tx onto the mined tx effect row.
      await dbTx
        .update(txEffect)
        .set({
          feePayer: pendingTx.feePayer ?? null,
          feePaymentMethod: pendingTx.feePaymentMethod ?? null,
          initiator: pendingTx.initiator ?? null,
        })
        .where(eq(txEffect.txHash, txEffectRow.txHash));

      try {
        await removeDroppedTxByHash(txEffectRow.txHash);
      } catch (e) {
        logger.error(
          `Error removing dropped tx ${txEffectRow.txHash}: ${(e as Error).stack}`,
        );
      }
    }
  });
};
