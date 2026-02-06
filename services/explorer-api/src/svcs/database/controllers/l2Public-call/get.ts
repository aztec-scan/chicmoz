import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString, type PublicCallRequest } from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
import { l2TxPublicCallRequest } from "../../../database/schema/l2public-call/index.js";

export const getPublicCallRequestsByTxHash = async (
  txHash: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select({
      txHash: l2TxPublicCallRequest.txHash,
      msgSender: l2TxPublicCallRequest.msgSender,
      contractAddress: l2TxPublicCallRequest.contractAddress,
      isStaticCall: l2TxPublicCallRequest.isStaticCall,
      calldataHash: l2TxPublicCallRequest.calldataHash,
    })
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.txHash, txHash));

  return res;
};

export const getPublicCallRequestsByContractAddress = async (
  contractAddress: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select({
      txHash: l2TxPublicCallRequest.txHash,
      msgSender: l2TxPublicCallRequest.msgSender,
      contractAddress: l2TxPublicCallRequest.contractAddress,
      isStaticCall: l2TxPublicCallRequest.isStaticCall,
      calldataHash: l2TxPublicCallRequest.calldataHash,
    })
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.contractAddress, contractAddress))
    .orderBy(desc(l2TxPublicCallRequest.txHash));

  return res;
};

export const getPublicCallRequestsBySenderAddress = async (
  msgSender: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select({
      txHash: l2TxPublicCallRequest.txHash,
      msgSender: l2TxPublicCallRequest.msgSender,
      contractAddress: l2TxPublicCallRequest.contractAddress,
      isStaticCall: l2TxPublicCallRequest.isStaticCall,
      calldataHash: l2TxPublicCallRequest.calldataHash,
    })
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.msgSender, msgSender))
    .orderBy(desc(l2TxPublicCallRequest.txHash));

  return res;
};
