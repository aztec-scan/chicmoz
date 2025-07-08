import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { l2TxPublicCallRequest } from "../../schema/index.js";

export const deletePublicCall = async (
  txHash: ChicmozL2PendingTx["txHash"],
): Promise<void> => {
  // Delete existing public call requests for this txHash
  await db()
    .delete(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.txHash, txHash));
};
