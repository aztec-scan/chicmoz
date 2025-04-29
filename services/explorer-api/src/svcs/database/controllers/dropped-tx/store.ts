import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL2DroppedTx } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { droppedTx } from "../../schema/dropped-tx/index.js";

export const storeDroppedTx = async (tx: ChicmozL2DroppedTx): Promise<void> => {
  const res = await db()
    .insert(droppedTx)
    .values({
      txHash: tx.txHash,
      reason: tx.reason,
      previousState: tx.previousState,
      orphanedTxEffectHash: tx.orphanedTxEffectHash,
      createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
      droppedAt: tx.droppedAt ? new Date(tx.droppedAt) : new Date(),
    })
    .onConflictDoNothing()
    .returning();
  if (res.length > 0) {
    logger.info(`🗑️ Transaction dropped: ${tx.txHash}, reason: ${tx.reason}`);
  }
};