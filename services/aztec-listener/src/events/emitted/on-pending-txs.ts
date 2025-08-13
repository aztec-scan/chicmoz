import { Tx } from "@aztec/aztec.js";
import { ChicmozL2PendingTx, PublicCallRequest } from "@chicmoz-pkg/types";
import { MEMPOOL_SYNC_GRACE_PERIOD_MS } from "../../environment.js";
import { logger } from "../../logger.js";
import { txsController } from "../../svcs/database/index.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

const extractPublicCallRequests = (tx: Tx): PublicCallRequest[] => {
  const publicCallRequests: PublicCallRequest[] = [];
  const nullAddress =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (tx.data.forPublic) {
    const allRequests = [
      ...tx.data.forPublic.nonRevertibleAccumulatedData.publicCallRequests,
      ...tx.data.forPublic.revertibleAccumulatedData.publicCallRequests,
    ];

    allRequests.forEach((request) => {
      if (
        request.msgSender.toString() !== nullAddress &&
        request.contractAddress.toString() !== nullAddress &&
        request.calldataHash.toString() !== nullAddress
      ) {
        publicCallRequests.push({
          msgSender: request.msgSender.toString(),
          contractAddress: request.contractAddress.toString(),
          isStaticCall: request.isStaticCall,
          calldataHash: request.calldataHash.toString(),
        });
      }
    });
  }
  return publicCallRequests;
};

export const onPendingTxs = async (pendingTxs: Tx[]) => {
  try {
    const storedTxs = await txsController.getTxs();

    const currentPendingTxs: ChicmozL2PendingTx[] = await Promise.all(
      pendingTxs.map(async (tx) => {
        const publicCallRequests = extractPublicCallRequests(tx);

        return {
          txHash: (await tx.getTxHash()).toString(),
          feePayer: tx.data.feePayer.toString(),
          birthTimestamp: new Date().getTime(),
          publicCallRequests:
            publicCallRequests.length > 0 ? publicCallRequests : undefined,
        };
      }),
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
      const ageMs = now.getTime() - storedTx.birthTimestamp;
      const beyondGracePeriod = ageMs >= MEMPOOL_SYNC_GRACE_PERIOD_MS;

      return (
        missingFromMempool &&
        storedTx.txState === "pending" &&
        beyondGracePeriod
      );
    });

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
            birthTimestamp: new Date().getTime(), // Fresh start timestamp
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
