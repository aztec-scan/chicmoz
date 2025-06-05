import { Tx } from "@aztec/aztec.js";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import { getTxs, storeOrUpdate } from "../../svcs/database/txs.controller.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

export const onPendingTxs = async (pendingTxs: Tx[]) => {
  try {
    const storedPendingTxs = await getTxs(["pending"]);

    const currentPendingTxs: ChicmozL2PendingTx[] = await Promise.all(
      pendingTxs.map(async (tx) => ({
        txHash: (await tx.getTxHash()).toString(),
        feePayer: tx.data.feePayer.toString(),
        birthTimestamp: new Date(),
      })),
    );

    const newTxs = currentPendingTxs.filter(
      (currentTx) =>
        !storedPendingTxs.some(
          (storedTx) => storedTx.txHash === currentTx.txHash,
        ),
    );

    const droppedTxs = storedPendingTxs.filter(
      (storedTx) =>
        !currentPendingTxs.some(
          (currentTx) => currentTx.txHash === storedTx.txHash,
        ),
    );

    logger.info(
      `🕐 total pending txs: ${currentPendingTxs.length}, new txs: ${newTxs.length}, dropped txs: ${droppedTxs.length}`,
    );

    if (newTxs.length > 0) {
      for (const newTx of newTxs) {
        await storeOrUpdate(newTx, "pending");
      }

      await publishMessage("PENDING_TXS_EVENT", {
        txs: newTxs,
      });
      logger.info(
        `📤 Published PENDING_TXS_EVENT for ${newTxs.length} new txs`,
      );
    }

    if (droppedTxs.length > 0) {
      for (const droppedTx of droppedTxs) {
        await storeOrUpdate(droppedTx, "dropped");
      }

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
