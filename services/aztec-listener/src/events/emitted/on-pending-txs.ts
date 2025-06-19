import { Tx } from "@aztec/aztec.js";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { MEMPOOL_SYNC_GRACE_PERIOD_MS } from "../../environment.js";
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

    // Handle resubmitted transactions (dropped or suspected_dropped → pending)
    const resubmittedTxs = currentPendingTxs.filter((currentTx) => {
      const existingTx = storedTxs.find(
        (storedTx) => storedTx.txHash === currentTx.txHash,
      );
      return (
        existingTx &&
        (existingTx.txState === "dropped" ||
          existingTx.txState === "suspected_dropped")
      );
    });

    const now = new Date();
    const newSuspectedDroppedTxs = storedTxs.filter((storedTx) => {
      const missingFromMempool = !currentPendingTxs.find(
        (currentTx) => currentTx.txHash === storedTx.txHash,
      );
      const ageMs = now.getTime() - storedTx.birthTimestamp.getTime();
      const beyondGracePeriod = ageMs >= MEMPOOL_SYNC_GRACE_PERIOD_MS;

      return (
        missingFromMempool &&
        storedTx.txState === "pending" &&
        beyondGracePeriod
      );
    });

    //Can be removed: Count transactions in grace period for logging
    const txsInGracePeriod = storedTxs.filter((storedTx) => {
      const missingFromMempool = !currentPendingTxs.find(
        (currentTx) => currentTx.txHash === storedTx.txHash,
      );
      const ageMs = now.getTime() - storedTx.birthTimestamp.getTime();
      const inGracePeriod = ageMs < MEMPOOL_SYNC_GRACE_PERIOD_MS;

      return (
        missingFromMempool && storedTx.txState === "pending" && inGracePeriod
      );
    });

    logger.info(
      `🕐 total txs in DB: ${storedTxs.length} total txs in "polled array": ${currentPendingTxs.length}, new txs: ${newTxs.length}, resubmitted txs: ${resubmittedTxs.length}, new suspected dropped txs: ${newSuspectedDroppedTxs.length}, txs in grace period: ${txsInGracePeriod.length}`,
    );

    if (txsInGracePeriod.length > 0) {
      txsInGracePeriod.forEach((tx) =>
        logger.debug(
          `⏳ ${tx.txHash} tx missing from mempool but still in grace period (${MEMPOOL_SYNC_GRACE_PERIOD_MS / 1000}s)`,
        ),
      );
    }

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

    // Process resubmitted transactions
    if (resubmittedTxs.length > 0) {
      for (const resubmittedTx of resubmittedTxs) {
        const existingTx = storedTxs.find(
          (storedTx) => storedTx.txHash === resubmittedTx.txHash,
        );
        if (existingTx) {
          // Update with fresh timestamp and pending state
          const updatedTx = {
            ...resubmittedTx,
            birthTimestamp: new Date(), // Fresh start timestamp
          };
          await txsController.storeOrUpdate(updatedTx, "pending");
        }
        logger.info(
          `🔄 Transaction ${resubmittedTx.txHash} resubmitted: → pending (fresh timestamp)`,
        );
      }

      await publishMessage("PENDING_TXS_EVENT", {
        txs: resubmittedTxs,
      });
      logger.info(
        `📤 Published PENDING_TXS_EVENT for ${resubmittedTxs.length} resubmitted txs`,
      );
    }

    if (newSuspectedDroppedTxs.length > 0) {
      for (const suspectedDroppedTx of newSuspectedDroppedTxs) {
        await txsController.storeOrUpdate(
          suspectedDroppedTx,
          "suspected_dropped",
        );
      }
      logger.info(
        `🚧 Marked ${newSuspectedDroppedTxs.length} txs as suspected_dropped (missing from mempool)`,
      );
    }
  } catch (error) {
    logger.error("Error handling pending txs:", error);
  }
};
