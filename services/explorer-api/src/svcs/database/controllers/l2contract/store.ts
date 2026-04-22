import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2ContractInstanceUpdatedEvent,
  ContractStandard,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeployedEvent,
  type ChicmozL2ContractInstanceVerifiedDeploymentArgumnetsSchema,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { and, eq, isNull } from "drizzle-orm";
import {
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
  l2ContractInstanceUpdate,
  l2ContractInstanceVerifiedDeploymentArguments,
  l2PrivateFunction,
  l2UtilityFunction,
} from "../../../database/schema/l2contract/index.js";
import { l2TxPublicCallRequest } from "../../../database/schema/l2public-call/index.js";
import { getFunctionNameFromArtifact } from "../../../../utils/resolve-artifact-names.js";
import { logger } from "../../../../logger.js";

export const storeContractInstanceDeployed = async (
  instance: ChicmozL2ContractInstanceDeployedEvent,
): Promise<void> => {
  const { publicKeys, ...rest } = instance;
  await db()
    .insert(l2ContractInstanceDeployed)
    .values({ ...publicKeys, ...rest });
};

export const storeContractInstanceUpdated = async (
  instance: ChicmozL2ContractInstanceUpdatedEvent,
): Promise<void> => {
  await db()
    .insert(l2ContractInstanceUpdate)
    .values({ ...instance });
};

export const storeContractInstanceVerifiedDeploymentArguments = async (
  verifiedDeploymentArguments: ChicmozL2ContractInstanceVerifiedDeploymentArgumnetsSchema,
): Promise<void> => {
  await db()
    .insert(l2ContractInstanceVerifiedDeploymentArguments)
    .values({ ...verifiedDeploymentArguments })
    .onConflictDoNothing();
};

export const storeContractClass = async (
  contractClass: ChicmozL2ContractClassRegisteredEvent,
): Promise<void> => {
  await db()
    .insert(l2ContractClassRegistered)
    .values({
      ...contractClass,
    });
};

export const addArtifactData = async ({
  contractClassId,
  version,
  artifactJson,
  contractName,
  standardData,
}: {
  contractClassId: string;
  version: number;
  artifactJson: string;
  contractName?: string;
  standardData?: ContractStandard;
}): Promise<void> => {
  await db()
    .update(l2ContractClassRegistered)
    .set({
      artifactJson,
      artifactContractName: contractName ?? null,
      standardContractType: standardData?.name ?? null,
      standardContractVersion: standardData?.version ?? null,
    })
    .where(
      and(
        eq(l2ContractClassRegistered.contractClassId, contractClassId),
        eq(l2ContractClassRegistered.version, version),
      ),
    )
    .execute();
};

export const storePrivateFunction = async (
  privateFunctionBroadcast: ChicmozL2PrivateFunctionBroadcastedEvent,
): Promise<void> => {
  const { privateFunction, ...rest } = privateFunctionBroadcast;
  await db()
    .insert(l2PrivateFunction)
    .values({
      ...rest,
      privateFunction_selector_value: privateFunction.selector.value,
      privateFunction_metadataHash: privateFunction.metadataHash,
      privateFunction_vkHash: privateFunction.vkHash,
      privateFunction_bytecode: privateFunction.bytecode,
    });
};

export const storeUtilityFunction = async (
  utilityFunctionBroadcast: ChicmozL2UtilityFunctionBroadcastedEvent,
): Promise<void> => {
  const { utilityFunction, ...rest } = utilityFunctionBroadcast;
  await db()
    .insert(l2UtilityFunction)
    .values({
      ...rest,
      utilityFunction_selector_value: utilityFunction.selector.value,
      utilityFunction_metadataHash: utilityFunction.metadataHash,
      utilityFunction_bytecode: utilityFunction.bytecode,
    });
};

/**
 * Backfills contractName and functionName on all tx_public_call_request rows
 * that are associated with instances of the given contract class and still have
 * a NULL contractName. Called after a new artifact is uploaded so that previously
 * indexed call requests get human-readable names retroactively.
 */
export const backfillPublicCallRequestNames = async ({
  contractClassId,
  version,
  artifactJson,
  contractName,
}: {
  contractClassId: string;
  version: number;
  artifactJson: string;
  contractName: string | undefined;
}): Promise<void> => {
  // Find all contract instance addresses belonging to this class
  const instances = await db()
    .select({ address: l2ContractInstanceDeployed.address })
    .from(l2ContractInstanceDeployed)
    .where(
      and(
        eq(l2ContractInstanceDeployed.currentContractClassId, contractClassId),
        eq(l2ContractInstanceDeployed.version, version),
      ),
    );

  if (instances.length === 0) {
    return;
  }

  const instanceAddressSet = new Set(instances.map((i) => i.address));

  // Fetch all call request rows for these instances that still have NULL contractName
  const candidateRows = await db()
    .select({
      txHash: l2TxPublicCallRequest.txHash,
      calldataHash: l2TxPublicCallRequest.calldataHash,
      contractAddress: l2TxPublicCallRequest.contractAddress,
      functionSelector: l2TxPublicCallRequest.functionSelector,
    })
    .from(l2TxPublicCallRequest)
    .where(isNull(l2TxPublicCallRequest.contractName));

  const rowsToUpdate = candidateRows.filter((r) =>
    instanceAddressSet.has(r.contractAddress),
  );

  if (rowsToUpdate.length === 0) {
    return;
  }

  // Update each row — function names differ per functionSelector so one UPDATE per row
  await Promise.all(
    rowsToUpdate.map(async (row) => {
      const functionName = row.functionSelector
        ? ((await getFunctionNameFromArtifact(
            artifactJson,
            row.functionSelector,
          )) ?? null)
        : null;

      return db()
        .update(l2TxPublicCallRequest)
        .set({ contractName: contractName ?? null, functionName })
        .where(
          and(
            eq(l2TxPublicCallRequest.txHash, row.txHash),
            eq(l2TxPublicCallRequest.calldataHash, row.calldataHash),
          ),
        );
    }),
  );

  logger.info(
    `🔎 Backfilled artifact names for ${rowsToUpdate.length} public call request(s) (classId: ${contractClassId})`,
  );
};
