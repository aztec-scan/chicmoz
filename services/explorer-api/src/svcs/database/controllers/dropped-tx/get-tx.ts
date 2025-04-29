import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2DroppedTx,
  HexString,
  chicmozL2DroppedTxSchema,
} from "@chicmoz-pkg/types";
import { asc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { droppedTx } from "../../../database/schema/dropped-tx/index.js";

export const getDroppedTxs = async (): Promise<ChicmozL2DroppedTx[]> => {
  const res = await db()
    .select({
      ...getTableColumns(droppedTx),
    })
    .from(droppedTx)
    .orderBy(asc(droppedTx.droppedAt));

  if (!res) {
    return [];
  }

  return z.array(chicmozL2DroppedTxSchema).parse(
    res.map((tx) => ({
      txHash: tx.txHash,
      reason: tx.reason,
      previousState: tx.previousState,
      orphanedTxEffectHash: tx.orphanedTxEffectHash,
      createdAt: tx.createdAt.getTime(),
      droppedAt: tx.droppedAt.getTime(),
    })),
  );
};

export const getDroppedTxByHash = async (
  hash: HexString,
): Promise<ChicmozL2DroppedTx | null> => {
  const res = await db()
    .select({ ...getTableColumns(droppedTx) })
    .from(droppedTx)
    .where(eq(droppedTx.txHash, hash))
    .limit(1);

  if (!res || res.length === 0) {
    return null;
  }

  return chicmozL2DroppedTxSchema.parse({
    txHash: res[0].txHash,
    reason: res[0].reason,
    previousState: res[0].previousState,
    orphanedTxEffectHash: res[0].orphanedTxEffectHash,
    createdAt: res[0].createdAt.getTime(),
    droppedAt: res[0].droppedAt.getTime(),
  });
};

