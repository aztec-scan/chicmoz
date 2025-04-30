import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { droppedTx } from "../../../database/schema/dropped-tx/index.js";

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

  return deletedEntries.length;
};
