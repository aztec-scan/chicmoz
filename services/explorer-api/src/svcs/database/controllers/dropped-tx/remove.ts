import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { droppedTx } from "../../../database/schema/dropped-tx/index.js";
import { txEffect } from "../../schema/index.js";
import { getDroppedTxs } from "./get-tx.js";

/**
 * Removes a dropped transaction by its hash
 *
 * @param txHash The hash of the transaction to remove
 * @returns The number of entries removed (0 or 1)
 */
export const removeDroppedTxByHash = async (
  txHash: HexString,
): Promise<number> => {
  const deletedEntries = await db()
    .delete(droppedTx)
    .where(eq(droppedTx.txHash, txHash))
    .returning();

  if (deletedEntries.length > 0) {
    logger.info(`🗑️🔥 removed dropped tx ${txHash}`);
  }

  return deletedEntries.length;
};

export const removeDroppedThatHaveTxEffects = async (): Promise<number> => {
  const allDroppedTxs = await getDroppedTxs();
  let count = 0;
  for (const tx of allDroppedTxs) {
    const txEffectRes = await db()
      .select()
      .from(txEffect)
      .where(eq(txEffect.txHash, tx.txHash))
      .limit(1);
    if (txEffectRes.length > 0) {
      await removeDroppedTxByHash(tx.txHash);
      count++;
    }
  }
  logger.info(`🗑️🗑️🔥🔥 removed ${count} dropped txs that already had a txEffect`);
  return count;
};
