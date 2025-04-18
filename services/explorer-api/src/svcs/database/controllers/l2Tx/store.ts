import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { l2Tx } from "../../schema/l2tx/index.js";

export const storeL2Tx = async (tx: ChicmozL2PendingTx): Promise<void> => {
  await db()
    .insert(l2Tx)
    .values({
      hash: tx.hash,
      birthTimestamp: new Date(tx.birthTimestamp),
    })
    .onConflictDoNothing();
};
