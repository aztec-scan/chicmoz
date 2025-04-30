import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2DroppedTx } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { droppedTx } from "../../schema/dropped-tx/index.js";

export const storeDroppedTx = async (tx: ChicmozL2DroppedTx): Promise<void> => {
  const res = await db()
    .insert(droppedTx)
    .values({
      txHash: tx.txHash,
      createdAt: tx.createdAt,
      droppedAt: tx.droppedAt,
    })
    .onConflictDoNothing()
    .returning();
  if (res.length > 0) {
    logger.info(`🗑️ Stored dropped tx: ${tx.txHash}`);
  }
};
