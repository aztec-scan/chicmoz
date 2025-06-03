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
import { and, eq } from "drizzle-orm";
import {
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
  l2ContractInstanceUpdate,
  l2ContractInstanceVerifiedDeploymentArguments,
  l2PrivateFunction,
  l2UtilityFunction,
} from "../../../database/schema/l2contract/index.js";

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
