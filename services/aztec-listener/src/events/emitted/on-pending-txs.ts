import { Tx } from "@aztec/aztec.js";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import {
  deletePendingTx,
  getAllPendingTxs,
  storePendingTx,
} from "../../svcs/database/pending-txs.controller.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

export const onPendingTxs = async (pendingTxs: Tx[]) => {
  try {
    // Get currently stored pending txs from DB
    const storedPendingTxs = await getAllPendingTxs();

    // Convert current pending txs to our format
    const currentPendingTxs: ChicmozL2PendingTx[] = await Promise.all(
      pendingTxs.map(async (tx) => ({
        txHash: (await tx.getTxHash()).toString(),
        feePayer: tx.data.feePayer.toString(),
        birthTimestamp: new Date(),
      })),
    );

    // Find new txs (in current but not in stored)
    const newTxs = currentPendingTxs.filter(
      (currentTx) =>
        !storedPendingTxs.some(
          (storedTx) => storedTx.txHash === currentTx.txHash,
        ),
    );

    // Find dropped txs (in stored but not in current)
    const droppedTxs = storedPendingTxs.filter(
      (storedTx) =>
        !currentPendingTxs.some(
          (currentTx) => currentTx.txHash === storedTx.txHash,
        ),
    );

    logger.info(
      `🕐 total pending txs: ${currentPendingTxs.length}, new txs: ${newTxs.length}, dropped txs: ${droppedTxs.length}`,
    );

    // Store new pending txs and publish pendingTxEvent
    if (newTxs.length > 0) {
      for (const newTx of newTxs) {
        await storePendingTx(newTx);
      }

      // Publish pendingTxEvent
      await publishMessage("PENDING_TXS_EVENT", {
        txs: newTxs,
      });
      logger.info(
        `📤 Published PENDING_TXS_EVENT for ${newTxs.length} new txs`,
      );
    }

    // Handle dropped txs
    if (droppedTxs.length > 0) {
      // Remove dropped txs from DB
      for (const droppedTx of droppedTxs) {
        await deletePendingTx(droppedTx.txHash);
      }

      // Publish droppedTxEvent
      await publishMessage("DROPPED_TXS_EVENT", {
        txs: droppedTxs.map((tx) => ({
          txHash: tx.txHash,
          createdAsPendingAt: tx.birthTimestamp,
          droppedAt: new Date(),
        })),
      });
      logger.info(
        `🗑️ Published DROPPED_TXS_EVENT for ${droppedTxs.length} dropped txs`,
      );
    }
  } catch (error) {
    logger.error("Error handling pending txs:", error);
  }
};
