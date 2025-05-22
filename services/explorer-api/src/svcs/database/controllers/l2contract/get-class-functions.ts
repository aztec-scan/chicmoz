import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2UtilityFunctionBroadcastedEventSchema,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { and, eq, getTableColumns } from "drizzle-orm";
import { l2PrivateFunction, l2UtilityFunction } from "../../schema/index.js";

export const getL2ContractClassPrivateFunction = async (
  contractClassId: ChicmozL2PrivateFunctionBroadcastedEvent["contractClassId"],
  functionSelector: ChicmozL2PrivateFunctionBroadcastedEvent["privateFunction"]["selector"]["value"],
): Promise<ChicmozL2PrivateFunctionBroadcastedEvent | null> => {
  const res = await db()
    .select({
      ...getTableColumns(l2PrivateFunction),
    })
    .from(l2PrivateFunction)
    .where(
      and(
        eq(l2PrivateFunction.contractClassId, contractClassId),
        eq(l2PrivateFunction.privateFunction_selector_value, functionSelector),
      ),
    )
    .limit(1);

  return res.length > 0
    ? chicmozL2PrivateFunctionBroadcastedEventSchema.parse({
        ...res[0],
        privateFunction: {
          selector: {
            value: res[0].privateFunction_selector_value,
          },
          metadataHash: res[0].privateFunction_metadataHash,
          vkHash: res[0].privateFunction_vkHash,
          bytecode: res[0].privateFunction_bytecode,
        },
      })
    : null;
};

export const getL2ContractClassPrivateFunctions = async (
  contractClassId: ChicmozL2PrivateFunctionBroadcastedEvent["contractClassId"],
): Promise<Array<ChicmozL2PrivateFunctionBroadcastedEvent>> => {
  const res = await db()
    .select({
      ...getTableColumns(l2PrivateFunction),
    })
    .from(l2PrivateFunction)
    .where(eq(l2PrivateFunction.contractClassId, contractClassId));
  return res.map((r) =>
    chicmozL2PrivateFunctionBroadcastedEventSchema.parse({
      ...r,
      privateFunction: {
        selector: {
          value: r.privateFunction_selector_value,
        },
        metadataHash: r.privateFunction_metadataHash,
        vkHash: r.privateFunction_vkHash,
        bytecode: r.privateFunction_bytecode,
      },
    }),
  );
};

export const getL2ContractClassUtilityFunction = async (
  contractClassId: ChicmozL2UtilityFunctionBroadcastedEvent["contractClassId"],
  functionSelector: ChicmozL2UtilityFunctionBroadcastedEvent["utilityFunction"]["selector"]["value"],
): Promise<ChicmozL2UtilityFunctionBroadcastedEvent | null> => {
  const res = await db()
    .select({
      ...getTableColumns(l2UtilityFunction),
    })
    .from(l2UtilityFunction)
    .where(
      and(
        eq(l2UtilityFunction.contractClassId, contractClassId),
        eq(l2UtilityFunction.utilityFunction_selector_value, functionSelector),
      ),
    )
    .limit(1);
  return res.length > 0
    ? chicmozL2UtilityFunctionBroadcastedEventSchema.parse({
        contractClassId: res[0].contractClassId,
        artifactMetadataHash: res[0].artifactMetadataHash,
        privateFunctionsArtifactTreeRoot:
          res[0].privateFunctionsArtifactTreeRoot,
        artifactFunctionTreeSiblingPath: res[0].artifactFunctionTreeSiblingPath,
        artifactFunctionTreeLeafIndex: res[0].artifactFunctionTreeLeafIndex,
        utilityFunction: {
          selector: {
            value: res[0].utilityFunction_selector_value,
          },
          metadataHash: res[0].utilityFunction_metadataHash,
          bytecode: res[0].utilityFunction_bytecode,
        },
      })
    : null;
};

export const getL2ContractClassUtilityFunctions = async (
  contractClassId: ChicmozL2UtilityFunctionBroadcastedEvent["contractClassId"],
): Promise<Array<ChicmozL2UtilityFunctionBroadcastedEvent>> => {
  const res = await db()
    .select({
      ...getTableColumns(l2UtilityFunction),
    })
    .from(l2UtilityFunction)
    .where(eq(l2UtilityFunction.contractClassId, contractClassId));
  return res.map((r) =>
    chicmozL2UtilityFunctionBroadcastedEventSchema.parse({
      contractClassId: r.contractClassId,
      artifactMetadataHash: r.artifactMetadataHash,
      privateFunctionsArtifactTreeRoot: r.privateFunctionsArtifactTreeRoot,
      artifactFunctionTreeSiblingPath: r.artifactFunctionTreeSiblingPath,
      artifactFunctionTreeLeafIndex: r.artifactFunctionTreeLeafIndex,
      utilityFunction: {
        selector: {
          value: r.utilityFunction_selector_value,
        },
        metadataHash: r.utilityFunction_metadataHash,
        bytecode: r.utilityFunction_bytecode,
      },
    }),
  );
};
