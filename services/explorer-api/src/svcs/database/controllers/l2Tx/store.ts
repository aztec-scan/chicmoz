import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { l2Tx } from "../../schema/l2tx/index.js";

export const storeL2Tx = async (tx: ChicmozL2PendingTx): Promise<void> => {
  const res = await db()
    .insert(l2Tx)
    .values(tx)
    .onConflictDoNothing()
    .returning();
  if (res.length > 0) {
    logger.info(`🕐 New pending tx: ${tx.txHash} stored successfully`);
  }
};

export const storeOrUpdateL2Tx = async (
  tx: ChicmozL2PendingTx,
): Promise<void> => {
  const res = await db()
    .insert(l2Tx)
    .values(tx)
    .onConflictDoUpdate({
      target: l2Tx.txHash,
      set: {
        birthTimestamp: tx.birthTimestamp,
        feePayer: tx.feePayer,
      },
    })
    .returning();

  if (res.length > 0) {
    logger.info(
      `🔄 Pending tx: ${tx.txHash} stored/updated successfully (timestamp: ${tx.birthTimestamp.toISOString()})`,
    );
  }
};
