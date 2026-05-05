import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString, type PublicCallRequest } from "@chicmoz-pkg/types";
import { desc, eq, inArray } from "drizzle-orm";
import { l2TxPublicCallRequest } from "../../../database/schema/l2public-call/index.js";

const selectColumns = {
  txHash: l2TxPublicCallRequest.txHash,
  msgSender: l2TxPublicCallRequest.msgSender,
  contractAddress: l2TxPublicCallRequest.contractAddress,
  isStaticCall: l2TxPublicCallRequest.isStaticCall,
  calldataHash: l2TxPublicCallRequest.calldataHash,
  callType: l2TxPublicCallRequest.callType,
  functionSelector: l2TxPublicCallRequest.functionSelector,
  contractName: l2TxPublicCallRequest.contractName,
  functionName: l2TxPublicCallRequest.functionName,
};

export const getPublicCallRequestsByTxHash = async (
  txHash: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select(selectColumns)
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.txHash, txHash));

  return res as PublicCallRequest[];
};

export const getPublicCallRequestsByTxHashes = async (
  txHashes: HexString[],
): Promise<Map<HexString, PublicCallRequest[]>> => {
  if (txHashes.length === 0) {
    return new Map();
  }
  const rows = await db()
    .select(selectColumns)
    .from(l2TxPublicCallRequest)
    .where(inArray(l2TxPublicCallRequest.txHash, txHashes));

  const result = new Map<HexString, PublicCallRequest[]>();
  for (const row of rows) {
    const list = result.get(row.txHash as HexString) ?? [];
    list.push(row as PublicCallRequest);
    result.set(row.txHash as HexString, list);
  }
  return result;
};

export const getPublicCallRequestsByContractAddress = async (
  contractAddress: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select(selectColumns)
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.contractAddress, contractAddress))
    .orderBy(desc(l2TxPublicCallRequest.txHash));

  return res as PublicCallRequest[];
};

export const getPublicCallRequestsBySenderAddress = async (
  msgSender: HexString,
): Promise<PublicCallRequest[]> => {
  const res = await db()
    .select(selectColumns)
    .from(l2TxPublicCallRequest)
    .where(eq(l2TxPublicCallRequest.msgSender, msgSender))
    .orderBy(desc(l2TxPublicCallRequest.txHash));

  return res as PublicCallRequest[];
};
