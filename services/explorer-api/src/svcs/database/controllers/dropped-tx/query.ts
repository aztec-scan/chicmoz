import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2DroppedTx,
  ChicmozL2DroppedTxPreviousState,
  ChicmozL2DroppedTxReason,
  chicmozL2DroppedTxSchema,
} from "@chicmoz-pkg/types";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { droppedTx } from "../../../database/schema/dropped-tx/index.js";

/**
 * Get dropped transactions by reason (reorg or stale)
 */
export const getDroppedTxsByReason = async (
  reason: ChicmozL2DroppedTxReason,
): Promise<ChicmozL2DroppedTx[]> => {
  const res = await db()
    .select({
      ...getTableColumns(droppedTx),
    })
    .from(droppedTx)
    .where(eq(droppedTx.reason, reason));

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

/**
 * Get dropped transactions by previous state (pending or included)
 */
export const getDroppedTxsByPreviousState = async (
  previousState: ChicmozL2DroppedTxPreviousState,
): Promise<ChicmozL2DroppedTx[]> => {
  const res = await db()
    .select({
      ...getTableColumns(droppedTx),
    })
    .from(droppedTx)
    .where(eq(droppedTx.previousState, previousState));

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
