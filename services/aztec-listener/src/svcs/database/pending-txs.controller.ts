import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx, HexString } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { pendingTxsTable } from "./schema.js";

export const storePendingTx = async (pendingTx: ChicmozL2PendingTx) => {
  await db().insert(pendingTxsTable).values(pendingTx);
};

export const getAllPendingTxs = async (): Promise<ChicmozL2PendingTx[]> => {
  return await db().select().from(pendingTxsTable);
};

export const deletePendingTx = async (txHash: HexString) => {
  await db().delete(pendingTxsTable).where(eq(pendingTxsTable.txHash, txHash));
};

export const getPendingTx = async (
  txHash: HexString,
): Promise<ChicmozL2PendingTx | undefined> => {
  const result = await db()
    .select()
    .from(pendingTxsTable)
    .where(eq(pendingTxsTable.txHash, txHash));
  return result[0];
};
