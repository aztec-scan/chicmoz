import { Tx } from "@aztec/aztec.js/tx";
import { ChicmozL2PendingTx, PublicCallRequest } from "@chicmoz-pkg/types";
import { MEMPOOL_SYNC_GRACE_PERIOD_MS } from "../../environment.js";
import { logger } from "../../logger.js";
import { txsController } from "../../svcs/database/index.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

const NULL_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const isNonNull = (address: string) => address !== NULL_ADDRESS;

const extractPublicCallRequests = (tx: Tx): PublicCallRequest[] => {
  const requests: PublicCallRequest[] = [];

  if (!tx.data.forPublic) {return requests;}

  const nonRevertible =
    tx.data.forPublic.nonRevertibleAccumulatedData.publicCallRequests;
  const revertible =
    tx.data.forPublic.revertibleAccumulatedData.publicCallRequests;
  const teardown = tx.data.forPublic.publicTeardownCallRequest;

  for (const req of nonRevertible) {
    if (
      isNonNull(req.msgSender.toString()) &&
      isNonNull(req.contractAddress.toString()) &&
      isNonNull(req.calldataHash.toString())
    ) {
      requests.push({
        msgSender: req.msgSender.toString(),
        contractAddress: req.contractAddress.toString(),
        isStaticCall: req.isStaticCall,
        calldataHash: req.calldataHash.toString(),
        callType: "non_revertible",
      });
    }
  }

  for (const req of revertible) {
    if (
      isNonNull(req.msgSender.toString()) &&
      isNonNull(req.contractAddress.toString()) &&
      isNonNull(req.calldataHash.toString())
    ) {
      requests.push({
        msgSender: req.msgSender.toString(),
        contractAddress: req.contractAddress.toString(),
        isStaticCall: req.isStaticCall,
        calldataHash: req.calldataHash.toString(),
        callType: "revertible",
      });
    }
  }

  if (
    teardown &&
    isNonNull(teardown.msgSender.toString()) &&
    isNonNull(teardown.contractAddress.toString()) &&
    isNonNull(teardown.calldataHash.toString())
  ) {
    requests.push({
      msgSender: teardown.msgSender.toString(),
      contractAddress: teardown.contractAddress.toString(),
      isStaticCall: teardown.isStaticCall,
      calldataHash: teardown.calldataHash.toString(),
      callType: "teardown",
    });
  }

  return requests;
};

const extractGasSettings = (tx: Tx) => {
  const gs = tx.data.constants.txContext.gasSettings;
  return {
    gasLimitDa: gs.gasLimits.daGas,
    gasLimitL2: gs.gasLimits.l2Gas,
    teardownGasLimitDa: gs.teardownGasLimits.daGas,
    teardownGasLimitL2: gs.teardownGasLimits.l2Gas,
    maxFeePerDaGas: gs.maxFeesPerGas.feePerDaGas.toString(),
    maxFeePerL2Gas: gs.maxFeesPerGas.feePerL2Gas.toString(),
    maxPriorityFeePerDaGas: gs.maxPriorityFeesPerGas.feePerDaGas.toString(),
    maxPriorityFeePerL2Gas: gs.maxPriorityFeesPerGas.feePerL2Gas.toString(),
  };
};

export const onPendingTxs = async (pendingTxs: Tx[]) => {
  try {
    const storedTxs = await txsController.getTxs();

    const currentPendingTxs: ChicmozL2PendingTx[] = await Promise.all(
      pendingTxs.map((tx) => {
        const publicCallRequests = extractPublicCallRequests(tx);
        const gasSettings = extractGasSettings(tx);
        const gasUsed = tx.data.gasUsed;
        const stats = tx.getStats();

        return {
          txHash: tx.getTxHash().toString(),
          feePayer: tx.data.feePayer.toString(),
          birthTimestamp: new Date().getTime(),
          expirationTimestamp: Number(tx.data.expirationTimestamp),
          gasLimitDa: gasSettings.gasLimitDa,
          gasLimitL2: gasSettings.gasLimitL2,
          teardownGasLimitDa: gasSettings.teardownGasLimitDa,
          teardownGasLimitL2: gasSettings.teardownGasLimitL2,
          maxFeePerDaGas: gasSettings.maxFeePerDaGas,
          maxFeePerL2Gas: gasSettings.maxFeePerL2Gas,
          maxPriorityFeePerDaGas: gasSettings.maxPriorityFeePerDaGas,
          maxPriorityFeePerL2Gas: gasSettings.maxPriorityFeePerL2Gas,
          gasUsedDa: gasUsed.daGas,
          gasUsedL2: gasUsed.l2Gas,
          feePaymentMethod: stats.feePaymentMethod,
          noteHashCount: tx.data.getNonEmptyNoteHashes().length,
          nullifierCount: tx.data.getNonEmptyNullifiers().length,
          l2ToL1MsgCount: tx.data.getNonEmptyL2ToL1Msgs().length,
          privateLogCount: tx.data.getNonEmptyPrivateLogs().length,
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
