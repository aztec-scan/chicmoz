import { Log } from "viem";
import { logger } from "../../logger.js";
import { controllers as dbControllers } from "../../svcs/database/index.js";
import {
  genericOnError,
  genericOnLogs,
  l2BlockProposedEventCallbacks,
  l2ProofVerifiedEventCallbacks,
} from "./callbacks/index.js";
import { AztecContract, AztecContracts, UnwatchCallback } from "./utils.js";

const emptyFilterArgs = {};
const WATCH_DEFAULT_IS_FINALIZED = false;

type WatchEventFunction = (
  args: Record<string, unknown>,
  options: {
    onLogs: (
      logs: (Log & {
        eventName: string | null;
        args: Record<string, unknown> | null;
      })[],
    ) => void;
    onError: (e: Error) => void;
    fromBlock: bigint;
  },
) => UnwatchCallback;

type ContractEventMap = Record<string, WatchEventFunction>;

const watchRollupL2BlockProposed = async ({
  contracts,
  latestHeight,
}: {
  contracts: AztecContracts;
  latestHeight: bigint;
}): Promise<UnwatchCallback> => {
  const { fromBlock, updateHeight, storeHeight } =
    await dbControllers.inMemoryHeightTracker({
      contractName: "rollup",
      contractAddress: contracts.rollup.address,
      eventName: "L2BlockProposed",
      isFinalized: WATCH_DEFAULT_IS_FINALIZED,
      latestHeight,
    });
  const callbacks = l2BlockProposedEventCallbacks({
    isFinalized: WATCH_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  return contracts.rollup.watchEvent.L2BlockProposed(emptyFilterArgs, {
    fromBlock,
    onError: callbacks.onError,
    onLogs: callbacks.onLogs,
  });
};

export const watchRollupL2ProofVerified = async ({
  contracts,
  latestHeight,
}: {
  contracts: AztecContracts;
  latestHeight: bigint;
}): Promise<UnwatchCallback> => {
  const { fromBlock, updateHeight, storeHeight } =
    await dbControllers.inMemoryHeightTracker({
      contractName: "rollup",
      contractAddress: contracts.rollup.address,
      eventName: "L2ProofVerified",
      isFinalized: WATCH_DEFAULT_IS_FINALIZED,
      latestHeight,
    });
  const callbacks = l2ProofVerifiedEventCallbacks({
    isFinalized: WATCH_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  return contracts.rollup.watchEvent.L2ProofVerified(emptyFilterArgs, {
    fromBlock,
    onError: callbacks.onError,
    onLogs: callbacks.onLogs,
  });
};

export const watchAllContractsEvents = async ({
  contracts,
  latestHeight,
}: {
  contracts: AztecContracts;
  latestHeight: bigint;
}): Promise<UnwatchCallback> => {
  const genericUnwatches = await Promise.all(
    (Object.entries(contracts) as [keyof AztecContracts, AztecContract][]).map(
      async ([name, contract]) => {
        const unwatches = [
          await watchContractEventsGeneric({
            name,
            contract,
            latestHeight,
          }),
        ];

        return () => {
          logger.info(`Unwatching events for ${name}`);
          unwatches.forEach((unwatch) => unwatch());
        };
      },
    ),
  );

  const unwatchRollupL2BlockProposed = await watchRollupL2BlockProposed({
    contracts,
    latestHeight,
  });
  const unwatchRollupL2ProofVerified = await watchRollupL2ProofVerified({
    contracts,
    latestHeight,
  });

  return () => {
    logger.info(`Unwatching generic events`);
    genericUnwatches.forEach((unwatch) => unwatch());
    logger.info(`Unwatching rollup events`);
    unwatchRollupL2BlockProposed();
    logger.info(`Unwatching rollup events`);
    unwatchRollupL2ProofVerified();
  };
};

export const watchContractEventsGeneric = async <T extends AztecContract>({
  name,
  contract,
  latestHeight,
}: {
  name: string;
  contract: T;
  latestHeight: bigint;
}): Promise<UnwatchCallback> => {
  const eventNames = contract.abi.filter(
    (item) => item.type === "event" && typeof item.name === "string",
  );
  const watchEvents = contract.watchEvent as unknown as ContractEventMap;

  const unwatches = await Promise.all(
    eventNames.map(async (event) => {
      const { fromBlock, updateHeight, storeHeight } =
        await dbControllers.inMemoryHeightTracker({
          contractName: name,
          contractAddress: contract.address,
          eventName: (event as { name: string }).name + "(generic)",
          isFinalized: WATCH_DEFAULT_IS_FINALIZED,
          latestHeight,
        });
      const eventName = (event as { name: string }).name;
      return watchEvents[eventName](
        {},
        {
          fromBlock,
          onError: (e) => {
            return genericOnError({ e, name, eventName });
          },
          onLogs: (logs) => {
            return genericOnLogs({
              logs,
              name,
              eventName,
              updateHeight,
              storeHeight,
            });
          },
        },
      );
    }),
  );

  return () => unwatches.forEach((unwatch) => unwatch());
};
