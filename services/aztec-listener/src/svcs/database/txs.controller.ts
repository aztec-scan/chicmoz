import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx, HexString } from "@chicmoz-pkg/types";
import { and, eq, inArray } from "drizzle-orm";
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

export const getTxs = async (statesWhitelist: TxState[] = []) => {
  return await db()
    .select()
    .from(txsTable)
    .where(inArray(txsTable.txState, statesWhitelist));
};

export const deleteTx = async (txHash: HexString, txState?: TxState) => {
  if (txState) {
    await db()
      .delete(txsTable)
      .where(and(eq(txsTable.txHash, txHash), eq(txsTable.txState, txState)));
  } else {
    await db().delete(txsTable).where(eq(txsTable.txHash, txHash));
  }
};

export const getTxByHash = async (txHash: HexString, txState?: TxState) => {
  if (txState) {
    const result = await db()
      .select()
      .from(txsTable)
      .where(and(eq(txsTable.txHash, txHash), eq(txsTable.txState, txState)))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }
  const result = await db()
    .select()
    .from(txsTable)
    .where(eq(txsTable.txHash, txHash))
    .limit(1);
  return result.length > 0 ? result[0] : null;
};
