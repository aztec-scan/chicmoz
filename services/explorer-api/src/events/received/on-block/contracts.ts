import { L2Block } from "@aztec/aztec.js";
import {
  ContractClassRegisteredEvent,
  PrivateFunctionBroadcastedEvent,
  UtilityFunctionBroadcastedEvent,
} from "@aztec/protocol-contracts/class-registerer";
import {
  ContractInstanceDeployedEvent,
  ContractInstanceUpdatedEvent,
} from "@aztec/protocol-contracts/instance-deployer";
import {
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
  ChicmozL2ContractInstanceUpdatedEvent,
  chicmozL2ContractInstanceUpdatedEventSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2UtilityFunctionBroadcastedEventSchema,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeployedEvent,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { logger } from "../../../logger.js";
import { controllers } from "../../../svcs/database/index.js";
import { handleDuplicateError } from "../utils.js";

const parseObjs = <ParsedType, AztecType>(
  blockHash: string,
  objs: AztecType[],
  parseFn: (obj: AztecType, blockHash?: string) => ParsedType,
) => {
  const parsedObjs: ParsedType[] = [];
  for (const obj of objs) {
    try {
      const parsed = parseFn(obj, blockHash);
      parsedObjs.push(parsed);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error(`Failed to parse object: ${e}`);
      logger.error((e as Error).stack);
    }
  }
  return parsedObjs;
};

const storeObj = async <T>(
  objs: T[],
  storeFn: (obj: T) => Promise<void>,
  objType: string,
  objId: keyof T,
) => {
  for (const obj of objs) {
    await storeFn(obj).catch((e) => {
      const duplicateErrorId = obj[objId] as string;
      handleDuplicateError(e as Error, `${objType} ${duplicateErrorId}`);
    });
  }
};

// NOTE: reference for parsing in aztec-packages: yarn-project/archiver/src/archiver/archiver.ts
export const storeContracts = async (b: L2Block, blockHash: string) => {
  const privateLogs = b.body.txEffects.flatMap(
    (txEffect) => txEffect.privateLogs,
  );

  const publicLogs = b.body.txEffects.flatMap(
    (txEffect) => txEffect.publicLogs,
  );

  // TODO: link contract instances & contract classes to blocks & txs: https://github.com/aztlan-labs/chicmoz/issues/285

  const contractInstanceDeployed = privateLogs
    .filter((log) =>
      ContractInstanceDeployedEvent.isContractInstanceDeployedEvent(log),
    )
    .map((log) => ContractInstanceDeployedEvent.fromLog(log))
    .map((e) => e.toContractInstance());

  const contractInstanceUpdated = publicLogs
    .filter((log) =>
      ContractInstanceUpdatedEvent.isContractInstanceUpdatedEvent(log),
    )
    .map((log) => ContractInstanceUpdatedEvent.fromLog(log))
    .map((e) => e.toContractInstanceUpdate());

  const contractClassLogs = b.body.txEffects
    .flatMap((txEffect) => (txEffect ? [txEffect.contractClassLogs] : []))
    .flat();

  const contractClassRegisteredEvents = contractClassLogs
    .filter((log) =>
      ContractClassRegisteredEvent.isContractClassRegisteredEvent(log),
    )
    .map((log) => ContractClassRegisteredEvent.fromLog(log));

  const contractClasses = await Promise.all(
    contractClassRegisteredEvents.map((e) => e.toContractClassPublic()),
  );

  const privateFnEvents = contractClassLogs
    .filter((log) =>
      PrivateFunctionBroadcastedEvent.isPrivateFunctionBroadcastedEvent(log),
    )
    .map((log) => PrivateFunctionBroadcastedEvent.fromLog(log));

  const utilityFnEvents = contractClassLogs
    .filter((log) =>
      UtilityFunctionBroadcastedEvent.isUtilityFunctionBroadcastedEvent(log),
    )
    .map((log) => UtilityFunctionBroadcastedEvent.fromLog(log));

  if (contractClasses.length > 0) {
    logger.info(
      `📜 Parsing and storing ${contractClasses.length} contract classes`,
    );
  }
  if (contractInstanceDeployed.length > 0) {
    logger.info(
      `📖 Parsing and storing ${contractInstanceDeployed.length} contract instances deployed`,
    );
  }
  if (contractInstanceUpdated.length > 0) {
    logger.info(
      `⬆️ Parsing and storing ${contractInstanceUpdated.length} contract instances updated`,
    );
  }
  if (privateFnEvents.length > 0) {
    logger.info(
      `🔒 Parsing and storing ${privateFnEvents.length} private function events`,
    );
  }
  if (utilityFnEvents.length > 0) {
    logger.info(
      `💪 Parsing and storing ${utilityFnEvents.length} utility function events`,
    );
  }

  const contractClassesWithId = contractClasses.map((contractClass) => {
    return {
      ...contractClass,
      contractClassId: contractClass.id,
    };
  });

  const parsedContractClasses: ChicmozL2ContractClassRegisteredEvent[] =
    parseObjs(blockHash, contractClassesWithId, (contractClass, blockHash) =>
      chicmozL2ContractClassRegisteredEventSchema.parse({
        ...contractClass,
        blockHash,
        contractClassId: contractClass.contractClassId.toString(),
        artifactHash: contractClass.artifactHash.toString(),
        privateFunctionsRoot: contractClass.privateFunctionsRoot.toString(),
      } as ChicmozL2ContractClassRegisteredEvent),
    );
  const parsedContractInstancesDeployed: ChicmozL2ContractInstanceDeployedEvent[] =
    parseObjs(
      blockHash,
      contractInstanceDeployed,
      (contractInstance, blockHash) =>
        chicmozL2ContractInstanceDeployedEventSchema.parse({
          ...contractInstance,
          blockHash,
          address: contractInstance.address.toString(),
          salt: contractInstance.salt.toString(),
          currentContractClassId:
            contractInstance.currentContractClassId.toString(),
          originalContractClassId:
            contractInstance.originalContractClassId.toString(),
          initializationHash: contractInstance.initializationHash.toString(),
          deployer: contractInstance.deployer.toString(),
          publicKeys: {
            masterNullifierPublicKey:
              contractInstance.publicKeys.masterNullifierPublicKey.toString(),
            masterIncomingViewingPublicKey:
              contractInstance.publicKeys.masterIncomingViewingPublicKey.toString(),
            masterOutgoingViewingPublicKey:
              contractInstance.publicKeys.masterOutgoingViewingPublicKey.toString(),
            masterTaggingPublicKey:
              contractInstance.publicKeys.masterTaggingPublicKey.toString(),
          },
        } as ChicmozL2ContractInstanceDeployedEvent),
    );
  const parsedContractInstanceUpdate: ChicmozL2ContractInstanceUpdatedEvent[] =
    parseObjs(blockHash, contractInstanceUpdated, (contractInstance) =>
      chicmozL2ContractInstanceUpdatedEventSchema.parse({
        ...contractInstance,
        timestampOfChange: z.number().parse(contractInstance.timestampOfChange),
        blockHash,
        address: contractInstance.address.toString(),
        prevContractClassId: contractInstance.prevContractClassId.toString(),
        newContractClassId: contractInstance.newContractClassId.toString(),
      } as ChicmozL2ContractInstanceUpdatedEvent),
    );
  const parsedPrivateFnEvents: ChicmozL2PrivateFunctionBroadcastedEvent[] =
    parseObjs(blockHash, privateFnEvents, (privateFnEvent) =>
      chicmozL2PrivateFunctionBroadcastedEventSchema.parse({
        ...privateFnEvent,
        blockHash,
        contractClassId: privateFnEvent.contractClassId.toString(),
        artifactMetadataHash: privateFnEvent.artifactMetadataHash.toString(),
        utilityFunctionsTreeRoot:
          privateFnEvent.utilityFunctionsTreeRoot.toString(),
        privateFunctionTreeSiblingPath:
          privateFnEvent.privateFunctionTreeSiblingPath.map((sibling) =>
            sibling.toString(),
          ),
        artifactFunctionTreeSiblingPath:
          privateFnEvent.artifactFunctionTreeSiblingPath.map((sibling) =>
            sibling.toString(),
          ),
        privateFunction: {
          ...privateFnEvent.privateFunction,
          metadataHash: privateFnEvent.privateFunction.metadataHash.toString(),
          vkHash: privateFnEvent.privateFunction.vkHash.toString(),
        },
      } as ChicmozL2PrivateFunctionBroadcastedEvent),
    );
  const parsedUtilityFnEvents: ChicmozL2UtilityFunctionBroadcastedEvent[] =
    parseObjs(blockHash, utilityFnEvents, (utilityFnEvent) =>
      chicmozL2UtilityFunctionBroadcastedEventSchema.parse({
        ...utilityFnEvent,
        blockHash,
        artifactMetadataHash: utilityFnEvent.artifactMetadataHash.toString(),
        artifactFunctionTreeSiblingPath:
          utilityFnEvent.artifactFunctionTreeSiblingPath.map((sibling) =>
            sibling.toString(),
          ),
        privateFunctionsArtifactTreeRoot:
          utilityFnEvent.privateFunctionsArtifactTreeRoot.toString(),
        contractClassId: utilityFnEvent.contractClassId.toString(),
        utilityFunction: {
          ...utilityFnEvent.utilityFunction,
          selector: {
            value: utilityFnEvent.utilityFunction.selector.value,
          },
          metadataHash: utilityFnEvent.utilityFunction.metadataHash.toString(),
        },
      } as ChicmozL2UtilityFunctionBroadcastedEvent),
    );

  await storeObj(
    parsedContractClasses,
    controllers.l2Contract.storeContractClass,
    "contractClass",
    "contractClassId",
  );
  await storeObj(
    parsedContractInstancesDeployed,
    controllers.l2Contract.storeContractInstanceDeployed,
    "contractInstanceDeployed",
    "address",
  );
  await storeObj(
    parsedContractInstanceUpdate,
    controllers.l2Contract.storeContractInstanceUpdated,
    "contractInstanceUpdated",
    "address",
  );
  await storeObj(
    parsedPrivateFnEvents,
    controllers.l2Contract.storePrivateFunction,
    "privateFunction",
    "artifactMetadataHash",
  );
  await storeObj(
    parsedUtilityFnEvents,
    controllers.l2Contract.storeUtilityFunction,
    "utilityFunction",
    "artifactMetadataHash",
  );
};
