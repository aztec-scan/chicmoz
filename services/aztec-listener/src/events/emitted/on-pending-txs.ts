import { Tx } from "@aztec/aztec.js/tx";
import {
  ChicmozL2PendingTx,
  ChicmozL2PendingL2ToL1Msg,
  HexString,
  PublicCallRequest,
} from "@chicmoz-pkg/types";
import { MEMPOOL_SYNC_GRACE_PERIOD_MS } from "../../environment.js";
import { logger } from "../../logger.js";
import { txsController } from "../../svcs/database/index.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

const NULL_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const isNonNull = (address: string) => address !== NULL_ADDRESS;

const extractPublicCallRequests = (tx: Tx): PublicCallRequest[] => {
  const requests: PublicCallRequest[] = [];

  if (!tx.data.forPublic) {
    return requests;
  }

  // Build a lookup map calldataHash → functionSelector from the calldata-enriched requests.
  // TODO: ABI decoding — map functionSelector to human-readable function name + decoded params.
  const calldataMap = new Map<string, string>();
  try {
    for (const r of tx.getPublicCallRequestsWithCalldata()) {
      calldataMap.set(
        r.request.calldataHash.toString(),
        r.functionSelector.toString(),
      );
    }
    const teardownWithCalldata = tx.getTeardownPublicCallRequestWithCalldata();
    if (teardownWithCalldata) {
      calldataMap.set(
        teardownWithCalldata.request.calldataHash.toString(),
        teardownWithCalldata.functionSelector.toString(),
      );
    }
  } catch {
    // getPublicCallRequestsWithCalldata may throw if calldata is unavailable; proceed without selectors
  }

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
        functionSelector: calldataMap.get(req.calldataHash.toString()),
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
        functionSelector: calldataMap.get(req.calldataHash.toString()),
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
      functionSelector: calldataMap.get(teardown.calldataHash.toString()),
    });
  }

  return requests;
};

const extractInitiator = (
  publicCallRequests: PublicCallRequest[],
): string | undefined => {
  // The outermost initiator is the msgSender of the first non-revertible call
  // (the account contract that signed and submitted the transaction).
  // Falls back to the first available call request for private-only txs that still
  // have some public component, or undefined for fully private transactions.
  return (
    publicCallRequests.find((r) => r.callType === "non_revertible")
      ?.msgSender ?? publicCallRequests[0]?.msgSender
  );
};

const extractL2ToL1Msgs = (
  tx: Tx,
  txHash: HexString,
): ChicmozL2PendingL2ToL1Msg[] => {
  const msgs: ChicmozL2PendingL2ToL1Msg[] = [];
  const raw = tx.data.getNonEmptyL2ToL1Msgs();

  for (let i = 0; i < raw.length; i++) {
    const scoped = raw[i];
    // Filter out empty / zero messages
    if (scoped.message.isEmpty()) {
      continue;
    }
    msgs.push({
      txHash,
      index: i,
      contractAddress: scoped.contractAddress.toString(),
      recipient: scoped.message.recipient.toString(),
      content: scoped.message.content.toString(),
    });
  }

  return msgs;
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
        const txHash = tx.getTxHash().toString() ;
        const publicCallRequests = extractPublicCallRequests(tx);
        const gasSettings = extractGasSettings(tx);
        const gasUsed = tx.data.gasUsed;
        const stats = tx.getStats();
        const l2ToL1Msgs = extractL2ToL1Msgs(tx, txHash);

        return {
          txHash,
          feePayer: tx.data.feePayer.toString(),
          birthTimestamp: new Date().getTime(),
          initiator: extractInitiator(publicCallRequests),
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
          l2ToL1Msgs: l2ToL1Msgs.length > 0 ? l2ToL1Msgs : undefined,
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
