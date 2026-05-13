import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx, HexString } from "@chicmoz-pkg/types";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "../../logger.js";
import { txsTable, TxState } from "./schema.js";

const buildTxRow = (pendingTx: ChicmozL2PendingTx, txState: TxState) => {
  const excludedAddresses = new Set(
    [pendingTx.feePayer, pendingTx.initiator].filter(Boolean),
  );
  const additionalSenders = [
    ...new Set(
      (pendingTx.publicCallRequests ?? [])
        .map((r) => r.msgSender)
        .filter((addr) => !excludedAddresses.has(addr)),
    ),
  ];

  return {
    txHash: pendingTx.txHash,
    feePayer: pendingTx.feePayer,
    initiator: pendingTx.initiator ?? undefined,
    additionalMsgSenders:
      additionalSenders.length > 0 ? additionalSenders.join(",") : undefined,
    birthTimestamp: pendingTx.birthTimestamp,
    txState,
  };
};

export const storeOrUpdate = async (
  pendingTx: ChicmozL2PendingTx,
  txState: TxState,
) => {
  const row = buildTxRow(pendingTx, txState);
  await db()
    .insert(txsTable)
    .values(row)
    .onConflictDoUpdate({
      target: txsTable.txHash,
      set: row,
    });
};

export const getTxs = async (
  statesWhitelist: TxState[] = [
    "pending",
    "suspected_dropped",
    "dropped",
    "proposed",
    "proven",
  ],
) => {
  const rows = await db()
    .select()
    .from(txsTable)
    .where(inArray(txsTable.txState, statesWhitelist));

  return rows.map((row) => ({
    ...row,
    initiator: row.initiator ?? undefined,
    additionalMsgSenders: row.additionalMsgSenders ?? undefined,
  }));
};

export const storeOrUpdateState = async (
  txHash: HexString,
  txState: TxState,
) => {
  await db()
    .update(txsTable)
    .set({ txState })
    .where(eq(txsTable.txHash, txHash));
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
    `🗑️ Deleted ${res.length} txs with hash ${txHash} and state ${txState}`,
  );
};
