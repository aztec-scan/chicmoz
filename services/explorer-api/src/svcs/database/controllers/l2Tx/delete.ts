import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { l2Tx } from "../../schema/index.js";

export const deleteTx = async (
  hash: ChicmozL2PendingTx["txHash"],
): Promise<void> => {
  await db().delete(l2Tx).where(eq(l2Tx.txHash, hash)).execute();
};
