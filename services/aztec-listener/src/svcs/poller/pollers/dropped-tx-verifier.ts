import {
  DROPPED_TX_VERIFICATION_INTERVAL_MS,
  DROPPED_TX_AGE_THRESHOLD_MS,
  DROPPED_TX_BLOCK_LOOKBACK,
} from "../../../environment.js";
import { logger } from "../../../logger.js";
import { txsController } from "../../database/index.js";
import { publishMessage } from "../../message-bus/index.js";
import { getBlock, getLatestProvenHeight } from "../network-client/index.js";

let pollInterval: NodeJS.Timeout;

export const start = () => {
  logger.info(
    `🔍 Starting dropped transaction verifier (interval: ${DROPPED_TX_VERIFICATION_INTERVAL_MS / 1000}s)`,
  );
  pollInterval = setInterval(() => {
    void verifyDroppedTransactions();
  }, DROPPED_TX_VERIFICATION_INTERVAL_MS);
};

export const stop = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    logger.info("🔍 Stopped dropped transaction verifier");
  }
};

const verifyDroppedTransactions = async () => {
  try {
    const suspectedDroppedTxs = await txsController.getTxs([
      "suspected_dropped",
    ]);

    if (suspectedDroppedTxs.length === 0) {
      logger.debug("🔍 No suspected dropped transactions to verify");
      return;
    }

    const now = new Date();
    const oldSuspectedTxs = suspectedDroppedTxs.filter((tx) => {
      const ageMs = now.getTime() - tx.birthTimestamp.getTime();
      return ageMs >= DROPPED_TX_AGE_THRESHOLD_MS;
    });

    if (oldSuspectedTxs.length === 0) {
      logger.debug(
        `🔍 ${suspectedDroppedTxs.length} suspected dropped txs found, but none are old enough (threshold: ${DROPPED_TX_AGE_THRESHOLD_MS / 1000}s)`,
      );
      return;
    }

    logger.info(
      `🔍 Verifying ${oldSuspectedTxs.length} old suspected dropped transactions`,
    );

    const latestHeight = await getLatestProvenHeight();
    const startHeight = Math.max(
      1,
      latestHeight - DROPPED_TX_BLOCK_LOOKBACK + 1,
    );

    const recentBlockTxHashes = new Set<string>();
    for (let height = startHeight; height <= latestHeight; height++) {
      try {
        const block = await getBlock(height);
        if (block) {
          block.body.txEffects.forEach((effect) => {
            recentBlockTxHashes.add(effect.txHash.toString());
          });
        }
      } catch (error) {
        logger.warn(
          `🔍 Failed to fetch block ${height} for verification:`,
          error,
        );
      }
    }

    const definitivelyDroppedTxs = [];
    const recoveredTxs = [];

    for (const suspectedTx of oldSuspectedTxs) {
      if (recentBlockTxHashes.has(suspectedTx.txHash)) {
        recoveredTxs.push(suspectedTx);
        await txsController.storeOrUpdate(suspectedTx, "proven");
        logger.info(
          `✅ Transaction ${suspectedTx.txHash} found in recent blocks, marked as proven`,
        );
      } else {
        definitivelyDroppedTxs.push(suspectedTx);
        await txsController.storeOrUpdate(suspectedTx, "dropped");
      }
    }

    if (definitivelyDroppedTxs.length > 0) {
      await publishMessage("DROPPED_TXS_EVENT", {
        txs: definitivelyDroppedTxs.map((tx) => ({
          txHash: tx.txHash,
          createdAsPendingAt: tx.birthTimestamp,
          droppedAt: new Date(),
        })),
      });

      logger.info(
        `🗑️ Confirmed ${definitivelyDroppedTxs.length} transactions as definitively dropped (kept in DB for audit trail)`,
      );
    }

    if (recoveredTxs.length > 0) {
      logger.info(
        `🔄 Recovered ${recoveredTxs.length} transactions that were found in recent blocks`,
      );
    }
  } catch (error) {
    logger.error("🔍 Error verifying dropped transactions:", error);
  }
};
