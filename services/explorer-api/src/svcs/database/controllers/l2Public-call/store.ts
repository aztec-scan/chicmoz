import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString, type PublicCallRequest } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { l2TxPublicCallRequest } from "../../schema/l2public-call/index.js";
import { deletePublicCall } from "./delete.js";

export const storePublicCallRequests = async (
  txHash: HexString,
  publicCallRequests: PublicCallRequest[],
): Promise<void> => {
  if (publicCallRequests.length === 0) {
    return;
  }

  await deletePublicCall(txHash);

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
