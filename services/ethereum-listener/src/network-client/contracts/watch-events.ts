import { type Log } from "viem";
import { logger } from "../../logger.js";
import { controllers as dbControllers } from "../../svcs/database/index.js";
import {
  genericOnError,
  genericOnLogs,
  l2BlockProposedEventCallbacks,
  l2ProofVerifiedEventCallbacks,
  proposedEventCallbacks,
  voteCastEventCallbacks,
  proposalExecutedEventCallbacks,
  proposalDroppedEventCallbacks,
  configurationUpdatedEventCallbacks,
  governanceProposerUpdatedEventCallbacks,
  signalCastEventCallbacks,
  payloadSubmittableEventCallbacks,
  payloadSubmittedEventCallbacks,
} from "./callbacks/index.js";
import {
  GENERIC_EVENT_ALLOWLIST,
  STRUCTURED_ROLLUP_EVENT_NAMES,
  STRUCTURED_GOVERNANCE_EVENT_NAMES,
  STRUCTURED_GOVERNANCE_PROPOSER_EVENT_NAMES,
} from "./event-allowlist.js";
import {
  type AztecContract,
  type AztecContracts,
  type UnwatchCallback,
} from "./utils.js";

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
      eventName: "CheckpointProposed",
      isFinalized: WATCH_DEFAULT_IS_FINALIZED,
      latestHeight,
    });
  const callbacks = l2BlockProposedEventCallbacks({
    isFinalized: WATCH_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  return contracts.rollup.watchEvent.CheckpointProposed(emptyFilterArgs, {
    fromBlock,
    onError: callbacks.onError,
    onLogs: (logs) => {
      void callbacks.onLogs(logs).catch(callbacks.onError);
    },
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
    onLogs: (logs) => {
      void callbacks.onLogs(logs).catch(callbacks.onError);
    },
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

  // Governance structured event watchers
  const unwatchGovernanceProposed = await watchGovernanceStructuredEvent({
    contract: contracts.governance,
    contractName: "governance",
    eventName: "Proposed",
    latestHeight,
    callbacksFactory: proposedEventCallbacks,
  });
  const unwatchGovernanceVoteCast = await watchGovernanceStructuredEvent({
    contract: contracts.governance,
    contractName: "governance",
    eventName: "VoteCast",
    latestHeight,
    callbacksFactory: voteCastEventCallbacks,
  });
  const unwatchGovernanceProposalExecuted =
    await watchGovernanceStructuredEvent({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "ProposalExecuted",
      latestHeight,
      callbacksFactory: proposalExecutedEventCallbacks,
    });
  const unwatchGovernanceProposalDropped =
    await watchGovernanceStructuredEvent({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "ProposalDropped",
      latestHeight,
      callbacksFactory: proposalDroppedEventCallbacks,
    });
  const unwatchGovernanceConfigurationUpdated =
    await watchGovernanceStructuredEvent({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "ConfigurationUpdated",
      latestHeight,
      callbacksFactory: configurationUpdatedEventCallbacks,
    });
  const unwatchGovernanceProposerUpdated = await watchGovernanceStructuredEvent({
    contract: contracts.governance,
    contractName: "governance",
    eventName: "GovernanceProposerUpdated",
    latestHeight,
    callbacksFactory: governanceProposerUpdatedEventCallbacks,
  });

  // GovernanceProposer structured event watchers
  const unwatchSignalCast = await watchGovernanceProposerStructuredEvent({
    contract: contracts.governanceProposer,
    contractName: "governanceProposer",
    eventName: "SignalCast",
    latestHeight,
    callbacksFactory: signalCastEventCallbacks,
  });
  const unwatchPayloadSubmittable =
    await watchGovernanceProposerStructuredEvent({
      contract: contracts.governanceProposer,
      contractName: "governanceProposer",
      eventName: "PayloadSubmittable",
      latestHeight,
      callbacksFactory: payloadSubmittableEventCallbacks,
    });
  const unwatchPayloadSubmitted =
    await watchGovernanceProposerStructuredEvent({
      contract: contracts.governanceProposer,
      contractName: "governanceProposer",
      eventName: "PayloadSubmitted",
      latestHeight,
      callbacksFactory: payloadSubmittedEventCallbacks,
    });

  return () => {
    logger.info(`Unwatching generic events`);
    genericUnwatches.forEach((unwatch) => unwatch());
    logger.info(`Unwatching rollup CheckpointProposed events`);
    unwatchRollupL2BlockProposed();
    logger.info(`Unwatching rollup L2ProofVerified events`);
    unwatchRollupL2ProofVerified();
    logger.info(`Unwatching governance Proposed events`);
    unwatchGovernanceProposed();
    logger.info(`Unwatching governance VoteCast events`);
    unwatchGovernanceVoteCast();
    logger.info(`Unwatching governance ProposalExecuted events`);
    unwatchGovernanceProposalExecuted();
    logger.info(`Unwatching governance ProposalDropped events`);
    unwatchGovernanceProposalDropped();
    logger.info(`Unwatching governance ConfigurationUpdated events`);
    unwatchGovernanceConfigurationUpdated();
    logger.info(`Unwatching governance GovernanceProposerUpdated events`);
    unwatchGovernanceProposerUpdated();
    logger.info(`Unwatching governanceProposer SignalCast events`);
    unwatchSignalCast();
    logger.info(`Unwatching governanceProposer PayloadSubmittable events`);
    unwatchPayloadSubmittable();
    logger.info(`Unwatching governanceProposer PayloadSubmitted events`);
    unwatchPayloadSubmitted();
  };
};

export const watchContractEventsGeneric = async <T extends AztecContract>({
  name,
  contract,
  latestHeight,
}: {
  name: keyof AztecContracts;
  contract: T;
  latestHeight: bigint;
}): Promise<UnwatchCallback> => {
  const abiEventNames = new Set(
    contract.abi
      .filter((item) => item.type === "event" && typeof item.name === "string")
      .map((item) => (item as { name: string }).name),
  );
  const eventNames = GENERIC_EVENT_ALLOWLIST[name].filter(
    (eventName) =>
      abiEventNames.has(eventName) &&
      !STRUCTURED_ROLLUP_EVENT_NAMES.has(eventName) &&
      !STRUCTURED_GOVERNANCE_EVENT_NAMES.has(eventName) &&
      !STRUCTURED_GOVERNANCE_PROPOSER_EVENT_NAMES.has(eventName),
  );

  if (!eventNames.length) {
    return () => undefined;
  }
  const watchEvents = contract.watchEvent as unknown as ContractEventMap;

  const unwatches = await Promise.all(
    eventNames.map(async (eventName) => {
      const { fromBlock, updateHeight, storeHeight } =
        await dbControllers.inMemoryHeightTracker({
          contractName: name,
          contractAddress: contract.address,
          eventName: eventName + "(generic)",
          isFinalized: WATCH_DEFAULT_IS_FINALIZED,
          latestHeight,
        });
      return watchEvents[eventName](
        {},
        {
          fromBlock,
          onError: (e) => {
            return genericOnError({ e, name, eventName });
          },
          onLogs: (logs) => {
            void genericOnLogs({
              logs,
              updateHeight,
              storeHeight,
              isFinalized: WATCH_DEFAULT_IS_FINALIZED,
            }).catch((e) => {
              genericOnError({ e: e as Error, name, eventName });
            });
          },
        },
      );
    }),
  );

  return () => unwatches.forEach((unwatch) => unwatch());
};

// ── Governance structured event watcher ──────────────────────────────────────

type GovernanceCallbacksFactory<TLogs> = (
  args: {
    isFinalized: boolean;
    updateHeight: (height: bigint) => void;
    storeHeight: () => Promise<void>;
  },
) => {
  onError: (e: Error) => void;
  onLogs: (logs: TLogs) => Promise<void>;
};

export const watchGovernanceStructuredEvent = async <TLogs>({
  contract,
  contractName,
  eventName,
  latestHeight,
  callbacksFactory,
}: {
  contract: import("./utils.js").GovernanceContract;
  contractName: "governance";
  eventName: string;
  latestHeight: bigint;
  callbacksFactory: GovernanceCallbacksFactory<TLogs>;
}): Promise<UnwatchCallback> => {
  const { fromBlock, updateHeight, storeHeight } =
    await dbControllers.inMemoryHeightTracker({
      contractName,
      contractAddress: contract.address,
      eventName,
      isFinalized: WATCH_DEFAULT_IS_FINALIZED,
      latestHeight,
    });
  const callbacks = callbacksFactory({
    isFinalized: WATCH_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  const watchEvents = contract.watchEvent as unknown as Record<
    string,
    WatchEventFunction
  >;
  return watchEvents[eventName](
    {},
    {
      fromBlock,
      onError: callbacks.onError,
      onLogs: (logs) => {
        void callbacks.onLogs(logs as unknown as TLogs).catch(callbacks.onError);
      },
    },
  );
};

export const watchGovernanceProposerStructuredEvent = async <TLogs>({
  contract,
  contractName,
  eventName,
  latestHeight,
  callbacksFactory,
}: {
  contract: import("./utils.js").GovernanceProposerContract;
  contractName: "governanceProposer";
  eventName: string;
  latestHeight: bigint;
  callbacksFactory: GovernanceCallbacksFactory<TLogs>;
}): Promise<UnwatchCallback> => {
  const { fromBlock, updateHeight, storeHeight } =
    await dbControllers.inMemoryHeightTracker({
      contractName,
      contractAddress: contract.address,
      eventName,
      isFinalized: WATCH_DEFAULT_IS_FINALIZED,
      latestHeight,
    });
  const callbacks = callbacksFactory({
    isFinalized: WATCH_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  const watchEvents = contract.watchEvent as unknown as Record<
    string,
    WatchEventFunction
  >;
  return watchEvents[eventName](
    {},
    {
      fromBlock,
      onError: callbacks.onError,
      onLogs: (logs) => {
        void callbacks.onLogs(logs as unknown as TLogs).catch(callbacks.onError);
      },
    },
  );
};
