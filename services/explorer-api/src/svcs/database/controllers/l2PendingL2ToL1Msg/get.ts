import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingL2ToL1Msg, HexString } from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
import { l2TxL2ToL1Msg } from "../../schema/index.js";

const selectColumns = {
  txHash: l2TxL2ToL1Msg.txHash,
  index: l2TxL2ToL1Msg.index,
  contractAddress: l2TxL2ToL1Msg.contractAddress,
  recipient: l2TxL2ToL1Msg.recipient,
  content: l2TxL2ToL1Msg.content,
};

export const getL2ToL1MsgsByTxHash = async (
  txHash: HexString,
): Promise<ChicmozL2PendingL2ToL1Msg[]> => {
  const res = await db()
    .select(selectColumns)
    .from(l2TxL2ToL1Msg)
    .where(eq(l2TxL2ToL1Msg.txHash, txHash));

  return res as ChicmozL2PendingL2ToL1Msg[];
};

export const getL2ToL1MsgsByContractAddress = async (
  contractAddress: HexString,
): Promise<ChicmozL2PendingL2ToL1Msg[]> => {
  const res = await db()
    .select(selectColumns)
    .from(l2TxL2ToL1Msg)
    .where(eq(l2TxL2ToL1Msg.contractAddress, contractAddress))
    .orderBy(desc(l2TxL2ToL1Msg.txHash));

  return res as ChicmozL2PendingL2ToL1Msg[];
};

export const getL2ToL1MsgsByRecipient = async (
  recipient: string,
): Promise<ChicmozL2PendingL2ToL1Msg[]> => {
  const res = await db()
    .select(selectColumns)
    .from(l2TxL2ToL1Msg)
    .where(eq(l2TxL2ToL1Msg.recipient, recipient))
    .orderBy(desc(l2TxL2ToL1Msg.txHash));

  return res as ChicmozL2PendingL2ToL1Msg[];
};
