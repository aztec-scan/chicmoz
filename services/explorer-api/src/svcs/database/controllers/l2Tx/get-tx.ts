import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  HexString,
  chicmozL2PendingTxSchema,
  type ChicmozL2PendingTx,
  type PublicCallRequest,
} from "@chicmoz-pkg/types";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import {
  l2Tx,
  l2TxPublicCallRequest,
} from "../../../database/schema/l2tx/index.js";

export const getTxs = async (): Promise<ChicmozL2PendingTx[]> => {
  const res = await db()
    .select({
      ...getTableColumns(l2Tx),
    })
    .from(l2Tx)
    .orderBy(desc(l2Tx.birthTimestamp));

  if (!res) {
    return [];
  }

  return z.array(chicmozL2PendingTxSchema).parse(
    res.map((tx) => ({
      ...tx,
      birthTimestamp: tx.birthTimestamp.getTime(),
    })),
  );
};

export const getPublicCallRequestsByTxHash = async (
  txHash: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select({
      msgSender: l2TxPublicCallRequest.msgSender,
      contractAddress: l2TxPublicCallRequest.contractAddress,
      isStaticCall: l2TxPublicCallRequest.isStaticCall,
      calldataHash: l2TxPublicCallRequest.calldataHash,
    })
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.txHash, txHash));

  return res;
};

export const getTxByHash = async (
  hash: HexString,
): Promise<ChicmozL2PendingTx | null> => {
  const res = await db()
    .select({ ...getTableColumns(l2Tx) })
    .from(l2Tx)
    .where(eq(l2Tx.txHash, hash))
    .limit(1);

  if (!res || res.length === 0) {
    return null;
  }

  const tx = res[0];
  const publicCallRequests = await getPublicCallRequestsByTxHash(hash);

  return {
    ...tx,
    publicCallRequests:
      publicCallRequests.length > 0 ? publicCallRequests : undefined,
  };
};
