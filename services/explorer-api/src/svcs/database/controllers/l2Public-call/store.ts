import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString, type PublicCallRequest } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import {
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
} from "../../schema/l2contract/index.js";
import { l2TxPublicCallRequest } from "../../schema/l2public-call/index.js";
import { getFunctionNameFromArtifact } from "../../../../utils/resolve-artifact-names.js";
import { logger } from "../../../../logger.js";
import { deletePublicCall } from "./delete.js";

/**
 * Resolves contractName and functionName for a single public call request
 * by joining through the contract instance → contract class tables.
 * Returns null for both if the contract instance or artifact is not found.
 */
const resolveArtifactNames = async (
  contractAddress: string,
  functionSelector: string | undefined,
): Promise<{ contractName: string | null; functionName: string | null }> => {
  const rows = await db()
    .select({
      artifactContractName: l2ContractClassRegistered.artifactContractName,
      artifactJson: l2ContractClassRegistered.artifactJson,
    })
    .from(l2ContractInstanceDeployed)
    .leftJoin(
      l2ContractClassRegistered,
      eq(
        l2ContractInstanceDeployed.currentContractClassId,
        l2ContractClassRegistered.contractClassId,
      ),
    )
    .where(eq(l2ContractInstanceDeployed.address, contractAddress))
    .limit(1);

  if (rows.length === 0 || !rows[0].artifactContractName) {
    return { contractName: null, functionName: null };
  }

  const { artifactContractName, artifactJson } = rows[0];

  const functionName =
    functionSelector && artifactJson
      ? ((await getFunctionNameFromArtifact(artifactJson, functionSelector)) ??
        null)
      : null;

  return { contractName: artifactContractName, functionName };
};

export const storePublicCallRequests = async (
  txHash: HexString,
  publicCallRequests: PublicCallRequest[],
): Promise<void> => {
  if (publicCallRequests.length === 0) {
    return;
  }

  await deletePublicCall(txHash);

  const values = await Promise.all(
    publicCallRequests.map(async (request) => {
      const { contractName, functionName } = await resolveArtifactNames(
        request.contractAddress,
        request.functionSelector,
      );
      return {
        txHash,
        msgSender: request.msgSender,
        contractAddress: request.contractAddress,
        isStaticCall: request.isStaticCall,
        calldataHash: request.calldataHash,
        callType: request.callType,
        functionSelector: request.functionSelector ?? null,
        contractName,
        functionName,
      };
    }),
  );

  await db().insert(l2TxPublicCallRequest).values(values);

  logger.info(
    `📋 Stored ${publicCallRequests.length} public call requests for tx: ${txHash}`,
  );
};
