import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { eq } from "drizzle-orm";
import { HexString } from "@chicmoz-pkg/types";
import { pendingTxsTable } from "./schema.js";

export interface PendingTx {
  txHash: HexString;
  feePayer: HexString;
  birthTimestamp: Date;
}

export const storePendingTx = async (pendingTx: PendingTx) => {
  await db().insert(pendingTxsTable).values(pendingTx);
};

export const getAllPendingTxs = async (): Promise<PendingTx[]> => {
  return await db().select().from(pendingTxsTable);
};

export const deletePendingTx = async (txHash: HexString) => {
  await db().delete(pendingTxsTable).where(eq(pendingTxsTable.txHash, txHash));
};

export const getPendingTx = async (txHash: HexString): Promise<PendingTx | undefined> => {
  const result = await db().select().from(pendingTxsTable).where(eq(pendingTxsTable.txHash, txHash));
  return result[0];
};
