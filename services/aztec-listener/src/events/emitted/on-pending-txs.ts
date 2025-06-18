import { Tx } from "@aztec/aztec.js";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import { txsController } from "../../svcs/database/index.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

export const onPendingTxs = async (pendingTxs: Tx[]) => {
  try {
    const storedTxs = await txsController.getTxs();

    const currentPendingTxs: ChicmozL2PendingTx[] = await Promise.all(
      pendingTxs.map(async (tx) => ({
        txHash: (await tx.getTxHash()).toString(),
        feePayer: tx.data.feePayer.toString(),
        birthTimestamp: new Date(),
      })),
    );

    const newTxs = currentPendingTxs.filter(
      (currentTx) =>
        !storedTxs.some((storedTx) => storedTx.txHash === currentTx.txHash),
    );

    const newSuspectedDroppedTxs = storedTxs.filter((storedTx) => {
      const dbTx = !currentPendingTxs.find(
        (currentTx) => currentTx.txHash === storedTx.txHash,
      );
      return dbTx && storedTx.txState === "pending";
    });

    logger.info(
      `🕐 total txs in DB: ${storedTxs.length} total txs in "polled array": ${currentPendingTxs.length}, new txs: ${newTxs.length}, new suspected dropped txs: ${newSuspectedDroppedTxs.length}`,
    );

    if (newTxs.length > 0) {
      for (const newTx of newTxs) {
        await txsController.storeOrUpdate(newTx, "pending");
      }

      await publishMessage("PENDING_TXS_EVENT", {
        txs: newTxs,
      });
      logger.info(
        `📤 Published PENDING_TXS_EVENT for ${newTxs.length} new txs`,
      );
    }

    if (newSuspectedDroppedTxs.length > 0) {
      for (const suspectedDroppedTx of newSuspectedDroppedTxs) {
        await txsController.storeOrUpdate(suspectedDroppedTx, "suspected_dropped");
      }
      logger.info(
        `⚠️ Marked ${newSuspectedDroppedTxs.length} txs as suspected_dropped (missing from mempool)`,
      );
    }
  } catch (error) {
    logger.error("Error handling pending txs:", error);
  }
};
