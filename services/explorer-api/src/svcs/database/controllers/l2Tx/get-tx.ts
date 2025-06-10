import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  HexString,
  chicmozL2PendingTxSchema,
  type ChicmozL2PendingTx,
} from "@chicmoz-pkg/types";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { l2Tx } from "../../../database/schema/l2tx/index.js";

export const getTxs = async (): Promise<ChicmozL2PendingTx[]> => {
  const res = await db()
    .select({
      ...getTableColumns(l2Tx),
    })
    .from(l2Tx)
    .orderBy(desc(l2Tx.birthTimestamp));

  if (!res) {
    return [];
  }

  return z.array(chicmozL2PendingTxSchema).parse(
    res.map((tx) => ({
      ...tx,
      birthTimestamp: tx.birthTimestamp.getTime(),
    })),
  );
};

export const getTxByHash = async (
  hash: HexString,
): Promise<ChicmozL2PendingTx | null> => {
  const res = await db()
    .select({ ...getTableColumns(l2Tx) })
    .from(l2Tx)
    .where(eq(l2Tx.txHash, hash))
    .limit(1);

  if (!res) {
    return null;
  }

  if (res.length === 0) {
    return null;
  }

  return chicmozL2PendingTxSchema.parse({
    txHash: res[0].txHash,
    feePayer: res[0].feePayer,
    birthTimestamp: res[0].birthTimestamp.getTime(),
  });
};
