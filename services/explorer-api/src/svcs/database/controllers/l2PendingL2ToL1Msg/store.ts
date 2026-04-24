import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingL2ToL1Msg, HexString } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { l2TxL2ToL1Msg } from "../../schema/index.js";
import { deleteL2ToL1Msgs } from "./delete.js";

export const storeL2ToL1Msgs = async (
  txHash: HexString,
  msgs: ChicmozL2PendingL2ToL1Msg[],
): Promise<void> => {
  if (msgs.length === 0) {
    return;
  }

  // Delete-then-insert for idempotency (same pattern as public call requests)
  await deleteL2ToL1Msgs(txHash);

  const values = msgs.map((msg) => ({
    txHash,
    index: msg.index,
    contractAddress: msg.contractAddress,
    recipient: msg.recipient,
    content: msg.content,
  }));

  await db().insert(l2TxL2ToL1Msg).values(values);

  logger.info(`📨 Stored ${msgs.length} L2-to-L1 messages for tx: ${txHash}`);
};
