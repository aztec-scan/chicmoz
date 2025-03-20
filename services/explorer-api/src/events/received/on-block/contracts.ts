import { L2Block } from "@aztec/aztec.js";
import {
  ContractClassRegisteredEvent,
  PrivateFunctionBroadcastedEvent,
  UnconstrainedFunctionBroadcastedEvent,
} from "@aztec/protocol-contracts/class-registerer";
import { ContractInstanceDeployedEvent } from "@aztec/protocol-contracts/instance-deployer";
import {
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2UnconstrainedFunctionBroadcastedEventSchema,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeployedEvent,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UnconstrainedFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { logger } from "../../../logger.js";
import { controllers } from "../../../svcs/database/index.js";
import { handleDuplicateError } from "../utils.js";

const parseObjs = <T>(
  blockHash: string,
  objs: (
    | ContractClassPublic
    | ContractInstanceWithAddress
    | PrivateFunctionBroadcastedEvent
    | UnconstrainedFunctionBroadcastedEvent
  )[],
  parseFn: (obj: unknown) => T
) => {
  const parsedObjs: T[] = [];
  for (const obj of objs) {
    try {
      const parsed = parseFn({
        blockHash,
        ...obj,
      });
      parsedObjs.push(parsed);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error(`Failed to parse object: ${e}`);
      logger.error((e as Error).stack);
      logger.error(JSON.stringify(obj, null, 2));
    }
  }
  return parsedObjs;
};

const storeObj = async <T>(
  objs: T[],
  storeFn: (obj: T) => Promise<void>,
  objType: string,
  objId: keyof T
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
    (txEffect) => txEffect.privateLogs
  );
  // TODO: link contract instances & contract classes to blocks & txs: https://github.com/aztlan-labs/chicmoz/issues/285

  const contractInstances = privateLogs
    .filter((log) =>
      ContractInstanceDeployedEvent.isContractInstanceDeployedEvent(log)
    )
    .map((log) => ContractInstanceDeployedEvent.fromLog(log))
    .map((e) => e.toContractInstance());

  const contractClassLogs = b.body.txEffects
    .flatMap((txEffect) => (txEffect ? [txEffect.contractClassLogs] : []))
    .flatMap((txLog) => txLog.unrollLogs());

  const contractClasses = await Promise.all(
    contractClassLogs
      .filter((log) =>
        ContractClassRegisteredEvent.isContractClassRegisteredEvent(log.data)
      )
      .map((log) => ContractClassRegisteredEvent.fromLog(log.data))
      .map((e) => e.toContractClassPublic())
  );

  const privateFnEvents = contractClassLogs
    .filter((log) =>
      PrivateFunctionBroadcastedEvent.isPrivateFunctionBroadcastedEvent(
        log.data
      )
    )
    .map((log) => PrivateFunctionBroadcastedEvent.fromLog(log.data));
  const unconstrainedFnEvents = contractClassLogs
    .filter((log) =>
      UnconstrainedFunctionBroadcastedEvent.isUnconstrainedFunctionBroadcastedEvent(
        log.data
      )
    )
    .map((log) => UnconstrainedFunctionBroadcastedEvent.fromLog(log.data));

  if (contractClasses.length > 0) {
    logger.info(
      `📜 Parsing and storing ${contractClasses.length} contract classes`
    );
  }
  if (contractInstances.length > 0) {
    logger.info(
      `📖 Parsing and storing ${contractInstances.length} contract instances`
    );
  }
  if (privateFnEvents.length > 0) {
    logger.info(
      `🔒 Parsing and storing ${privateFnEvents.length} private function events`
    );
  }
  if (unconstrainedFnEvents.length > 0) {
    logger.info(
      `💪 Parsing and storing ${unconstrainedFnEvents.length} unconstrained function events`
    );
  }

  const contractClassesWithId = contractClasses.map((contractClass) => {
    return {
      ...contractClass,
      contractClassId: contractClass.id,
    };
  });

  const parsedContractClasses: ChicmozL2ContractClassRegisteredEvent[] =
    parseObjs(blockHash, contractClassesWithId, (contractClass) =>
      chicmozL2ContractClassRegisteredEventSchema.parse(contractClass)
    );
  const parsedContractInstances: ChicmozL2ContractInstanceDeployedEvent[] =
    parseObjs(blockHash, contractInstances, (contractInstance) =>
      chicmozL2ContractInstanceDeployedEventSchema.parse(contractInstance)
    );
  const parsedPrivateFnEvents: ChicmozL2PrivateFunctionBroadcastedEvent[] =
    parseObjs(blockHash, privateFnEvents, (privateFnEvent) =>
      chicmozL2PrivateFunctionBroadcastedEventSchema.parse(privateFnEvent)
    );
  const parsedUnconstrainedFnEvents: ChicmozL2UnconstrainedFunctionBroadcastedEvent[] =
    parseObjs(blockHash, unconstrainedFnEvents, (unconstrainedFnEvent) =>
      chicmozL2UnconstrainedFunctionBroadcastedEventSchema.parse(
        unconstrainedFnEvent
      )
    );

  await storeObj(
    parsedContractClasses,
    controllers.l2Contract.storeContractClass,
    "contractClass",
    "contractClassId"
  );
  await storeObj(
    parsedContractInstances,
    controllers.l2Contract.storeContractInstance,
    "contractInstance",
    "address"
  );
  await storeObj(
    parsedPrivateFnEvents,
    controllers.l2Contract.storePrivateFunction,
    "privateFunction",
    "artifactMetadataHash"
  );
  await storeObj(
    parsedUnconstrainedFnEvents,
    controllers.l2Contract.storeUnconstrainedFunction,
    "unconstrainedFunction",
    "artifactMetadataHash"
  );
};
