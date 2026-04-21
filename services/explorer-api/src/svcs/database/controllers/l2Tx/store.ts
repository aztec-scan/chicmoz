import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { l2Tx } from "../../schema/l2tx/index.js";
import { storePublicCallRequests } from "../l2Public-call/store.js";
import { storeL2ToL1Msgs } from "../l2PendingL2ToL1Msg/store.js";

export const storeL2Tx = async (tx: ChicmozL2PendingTx): Promise<void> => {
  const res = await db()
    .insert(l2Tx)
    .values(tx)
    .onConflictDoNothing()
    .returning();
  if (res.length > 0) {
    logger.info(`🕐 New pending tx: ${tx.txHash} stored successfully`);
  }
};

export const storeOrUpdateL2Tx = async (
  tx: ChicmozL2PendingTx,
): Promise<void> => {
  const res = await db()
    .insert(l2Tx)
    .values(tx)
    .onConflictDoUpdate({
      target: l2Tx.txHash,
      set: {
        birthTimestamp: tx.birthTimestamp,
        feePayer: tx.feePayer,
        initiator: tx.initiator ?? null,
        expirationTimestamp: tx.expirationTimestamp,
        gasLimitDa: tx.gasLimitDa,
        gasLimitL2: tx.gasLimitL2,
        teardownGasLimitDa: tx.teardownGasLimitDa,
        teardownGasLimitL2: tx.teardownGasLimitL2,
        maxFeePerDaGas: tx.maxFeePerDaGas,
        maxFeePerL2Gas: tx.maxFeePerL2Gas,
        maxPriorityFeePerDaGas: tx.maxPriorityFeePerDaGas,
        maxPriorityFeePerL2Gas: tx.maxPriorityFeePerL2Gas,
        gasUsedDa: tx.gasUsedDa,
        gasUsedL2: tx.gasUsedL2,
        feePaymentMethod: tx.feePaymentMethod,
        noteHashCount: tx.noteHashCount,
        nullifierCount: tx.nullifierCount,
        l2ToL1MsgCount: tx.l2ToL1MsgCount,
        privateLogCount: tx.privateLogCount,
      },
    })
    .returning();

  if (res.length > 0) {
    logger.info(
      `🔄 Pending tx: ${tx.txHash} stored/updated successfully (timestamp: ${tx.birthTimestamp.toString()})`,
    );
  }

  // Store public call requests if they exist
  if (tx.publicCallRequests && tx.publicCallRequests.length > 0) {
    await storePublicCallRequests(tx.txHash, tx.publicCallRequests);
  }

  // Store L2-to-L1 messages if they exist
  if (tx.l2ToL1Msgs && tx.l2ToL1Msgs.length > 0) {
    await storeL2ToL1Msgs(tx.txHash, tx.l2ToL1Msgs);
  }
};
