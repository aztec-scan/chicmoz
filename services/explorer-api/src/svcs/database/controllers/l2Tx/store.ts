import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  HexString,
  type ChicmozL2PendingTx,
  type PublicCallRequest,
} from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { l2Tx, l2TxPublicCallRequest } from "../../schema/l2tx/index.js";

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

export const storePublicCallRequests = async (
  txHash: HexString,
  publicCallRequests: PublicCallRequest[],
): Promise<void> => {
  if (publicCallRequests.length === 0) {return;}

  // Delete existing public call requests for this txHash
  await db()
    .delete(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.txHash, txHash));

  // Insert new public call requests
  const values = publicCallRequests.map((request, index) => ({
    id: `${txHash}-${index}`,
    txHash,
    msgSender: request.msgSender,
    contractAddress: request.contractAddress,
    isStaticCall: request.isStaticCall,
    calldataHash: request.calldataHash,
  }));

  await db().insert(l2TxPublicCallRequest).values(values);

  logger.info(
    `📋 Stored ${publicCallRequests.length} public call requests for tx: ${txHash}`,
  );
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
      },
    })
    .returning();

  if (res.length > 0) {
    logger.info(
      `🔄 Pending tx: ${tx.txHash} stored/updated successfully (timestamp: ${tx.birthTimestamp.toISOString()})`,
    );
  }

  // Store public call requests if they exist
  if (tx.publicCallRequests && tx.publicCallRequests.length > 0) {
    await storePublicCallRequests(tx.txHash, tx.publicCallRequests);
  }
};
