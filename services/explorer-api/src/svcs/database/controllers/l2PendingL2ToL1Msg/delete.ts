import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { l2TxL2ToL1Msg } from "../../schema/index.js";

export const deleteL2ToL1Msgs = async (
  txHash: ChicmozL2PendingTx["txHash"],
): Promise<void> => {
  await db().delete(l2TxL2ToL1Msg).where(eq(l2TxL2ToL1Msg.txHash, txHash));
};
