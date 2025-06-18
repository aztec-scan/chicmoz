import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx, HexString } from "@chicmoz-pkg/types";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "../../logger.js";
import { txsTable, TxState } from "./schema.js";

export const storeOrUpdate = async (
  pendingTx: ChicmozL2PendingTx,
  txState: TxState,
) => {
  await db()
    .insert(txsTable)
    .values({
      ...pendingTx,
      txState,
    })
    .onConflictDoUpdate({
      target: txsTable.txHash,
      set: {
        ...pendingTx,
        txState,
      },
    });
};

export const getTxs = async (
  statesWhitelist: TxState[] = ["pending", "suspected_dropped", "dropped", "proposed", "proven"],
) => {
  return await db()
    .select()
    .from(txsTable)
    .where(inArray(txsTable.txState, statesWhitelist));
};

export const deleteTx = async (txHash: HexString, txState?: TxState) => {
  let res;
  if (txState) {
    res = await db()
      .delete(txsTable)
      .where(and(eq(txsTable.txHash, txHash), eq(txsTable.txState, txState)))
      .returning();
  } else {
    res = await db()
      .delete(txsTable)
      .where(eq(txsTable.txHash, txHash))
      .returning();
  }
  logger.info(
    `🗑️ Published DROPPED_TXS_EVENT for ${res.length} txs with hash ${txHash} and state ${txState}`,
  );
};
