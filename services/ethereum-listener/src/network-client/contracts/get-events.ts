import { type PublicClient } from "viem";
import { logger } from "../../logger.js";
import { controllers as dbControllers } from "../../svcs/database/index.js";
import { getPublicHttpClient } from "../client/index.js";
import { genericOnLogs, type onLogsLogs } from "./callbacks/index.js";
import {
  depositEventCallbacks,
  l2BlockProposedEventCallbacks,
  l2ProofVerifiedEventCallbacks,
  slashedEventCallbacks,
  withdrawFinalisedEventCallbacks,
  withdrawInitiatedEventCallbacks,
} from "./callbacks/rollup.js";
import {
  proposedEventCallbacks,
  voteCastEventCallbacks,
  proposalExecutedEventCallbacks,
  proposalDroppedEventCallbacks,
  configurationUpdatedEventCallbacks,
  governanceProposerUpdatedEventCallbacks,
  signalCastEventCallbacks,
  payloadSubmittableEventCallbacks,
  payloadSubmittedEventCallbacks,
} from "./callbacks/governance.js";
import {
  GENERIC_EVENT_ALLOWLIST,
  STRUCTURED_GOVERNANCE_EVENT_NAMES,
  STRUCTURED_GOVERNANCE_PROPOSER_EVENT_NAMES,
  STRUCTURED_ROLLUP_EVENT_NAMES,
} from "./event-allowlist.js";
import {
  type AztecContract,
  type AztecContracts,
  type GovernanceContract,
  type GovernanceProposerContract,
} from "./utils.js";

const GET_EVENTS_DEFAULT_IS_FINALIZED = true;
export const DEFAULT_BLOCK_CHUNK_SIZE = 500n;

const getStoreHeightForRange = (
  actualToBlock: bigint | "finalized",
  latestHeight: bigint,
) => (actualToBlock === "finalized" ? latestHeight : actualToBlock);

const getActualToBlock = (
  fromBlock: bigint,
  latestHeight: bigint,
  toBlock: "finalized",
) => {
  const actualToBlock =
    latestHeight - fromBlock > DEFAULT_BLOCK_CHUNK_SIZE
      ? fromBlock + DEFAULT_BLOCK_CHUNK_SIZE
      : toBlock;
  return actualToBlock;
};

type GetEventsFunction = (
  args: Record<string, unknown>,
  options: {
    fromBlock: bigint;
    toBlock: bigint | "finalized";
  },
) => Promise<onLogsLogs>;

type ContractEventMap = Record<string, GetEventsFunction>;

const getGenericContractEventLogs = async ({
  name,
  contract,
  eventName,
  latestHeight,
}: {
  name: keyof AztecContracts;
  contract: AztecContract;
  eventName: string;
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: name,
    contractAddress: contract.address,
    eventName: eventName + "(generic)",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info(`${name}.${eventName} generic logs up to date`);
    return 0n;
  }

  const actualToBlock = getActualToBlock(fromBlock, latestHeight, "finalized");
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const getEvents = contract.getEvents as unknown as ContractEventMap;
  const logs = await getEvents[eventName](
    {},
    {
      fromBlock,
      toBlock: actualToBlock,
    },
  );
  await genericOnLogs({
    logs,
    updateHeight,
    storeHeight,
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
  });
  return latestHeight - getMemoryHeight();
};

const getAllGenericContractEventLogs = async ({
  contracts,
  latestHeight,
}: {
  contracts: AztecContracts;
  latestHeight: bigint;
}) => {
  const pollers: Promise<bigint>[] = [];
  for (const [name, contract] of Object.entries(contracts) as [
    keyof AztecContracts,
    AztecContract,
  ][]) {
    const abiEventNames = new Set(
      contract.abi
        .filter(
          (item) => item.type === "event" && typeof item.name === "string",
        )
        .map((item) => (item as { name: string }).name),
    );
    const eventNames = GENERIC_EVENT_ALLOWLIST[name].filter(
      (eventName) =>
        abiEventNames.has(eventName) &&
        !STRUCTURED_ROLLUP_EVENT_NAMES.has(eventName) &&
        !STRUCTURED_GOVERNANCE_EVENT_NAMES.has(eventName) &&
        !STRUCTURED_GOVERNANCE_PROPOSER_EVENT_NAMES.has(eventName),
    );

    pollers.push(
      ...eventNames.map((eventName) =>
        getGenericContractEventLogs({
          name,
          contract,
          eventName,
          latestHeight,
        }),
      ),
    );
  }

  return Promise.all(pollers);
};

const getRollupL2BlockProposedLogs = async ({
  client,
  contracts,
  toBlock,
  latestHeight,
}: {
  client: PublicClient;
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: "rollup",
    contractAddress: contracts.rollup.address,
    eventName: "CheckpointProposed",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info("Rollup CheckpointProposed logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const rollupL2BlockProposedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "CheckpointProposed",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  await l2BlockProposedEventCallbacks({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(rollupL2BlockProposedLogs);
  return latestHeight - getMemoryHeight();
};

const getRollupL2ProofVerifiedLogs = async ({
  client,
  contracts,
  toBlock,
  latestHeight,
}: {
  client: PublicClient;
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: "rollup",
    contractAddress: contracts.rollup.address,
    eventName: "L2ProofVerified",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info("Rollup L2ProofVerified logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const rollupL2ProofVerifiedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "L2ProofVerified",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  await l2ProofVerifiedEventCallbacks({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(rollupL2ProofVerifiedLogs);
  return latestHeight - getMemoryHeight();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDepositLogs = async ({
  client,
  contracts,
  toBlock,
  latestHeight,
}: {
  client: PublicClient;
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: "rollup",
    contractAddress: contracts.rollup.address,
    eventName: "Deposit",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info("Rollup Deposit logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const depositLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "Deposit",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  await depositEventCallbacks({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(depositLogs);
  return latestHeight - getMemoryHeight();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getWithdrawInitiatedLogs = async ({
  client,
  contracts,
  toBlock,
  latestHeight,
}: {
  client: PublicClient;
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: "rollup",
    contractAddress: contracts.rollup.address,
    eventName: "WithdrawInitiated",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info("Rollup WithdrawInitiated logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const withdrawInitiatedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "WithdrawInitiated",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  await withdrawInitiatedEventCallbacks({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(withdrawInitiatedLogs);
  return latestHeight - getMemoryHeight();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getWithdrawFinalizedLogs = async ({
  client,
  contracts,
  toBlock,
  latestHeight,
}: {
  client: PublicClient;
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: "rollup",
    contractAddress: contracts.rollup.address,
    eventName: "WithdrawFinalised",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info("Rollup WithdrawFinalised logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const withdrawFinalisedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "WithdrawFinalized",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  await withdrawFinalisedEventCallbacks({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(withdrawFinalisedLogs);
  return latestHeight - getMemoryHeight();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSlashedLogs = async ({
  client,
  contracts,
  toBlock,
  latestHeight,
}: {
  client: PublicClient;
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName: "rollup",
    contractAddress: contracts.rollup.address,
    eventName: "Slashed",
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info("Rollup Slashed logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const slashedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "Slashed",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  await slashedEventCallbacks({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(slashedLogs);
  return latestHeight - getMemoryHeight();
};

// ── Governance structured event fetchers ─────────────────────────────────────

type GovernanceCallbacksFactory = (
  args: {
    isFinalized: boolean;
    updateHeight: (height: bigint) => void;
    storeHeight: () => Promise<void>;
  },
) => {
  onError: (e: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLogs: (logs: any) => Promise<void>;
};

type GovernanceGetEventsFn = (
  args: Record<string, unknown>,
  options: { fromBlock: bigint; toBlock: bigint | "finalized" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<any>;

const getGovernanceStructuredEventLogs = async ({
  contract,
  contractName,
  eventName,
  latestHeight,
  callbacksFactory,
}: {
  contract: GovernanceContract;
  contractName: string;
  eventName: string;
  latestHeight: bigint;
  callbacksFactory: GovernanceCallbacksFactory;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName,
    contractAddress: contract.address,
    eventName,
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info(`Governance ${eventName} logs up to date`);
    return 0n;
  }

  const actualToBlock = getActualToBlock(fromBlock, latestHeight, "finalized");
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const callbacks = callbacksFactory({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  const getEvents = contract.getEvents as unknown as Record<
    string,
    GovernanceGetEventsFn
  >;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const logs = await getEvents[eventName]({}, { fromBlock, toBlock: actualToBlock });
  await callbacks.onLogs(logs);
  return latestHeight - getMemoryHeight();
};

const getGovernanceProposerStructuredEventLogs = async ({
  contract,
  contractName,
  eventName,
  latestHeight,
  callbacksFactory,
}: {
  contract: GovernanceProposerContract;
  contractName: string;
  eventName: string;
  latestHeight: bigint;
  callbacksFactory: GovernanceCallbacksFactory;
}) => {
  const {
    fromBlock,
    updateHeight,
    storeHeight,
    getMemoryHeight,
    setOverrideStoreHeight,
  } = await dbControllers.inMemoryHeightTracker({
    contractName,
    contractAddress: contract.address,
    eventName,
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock > latestHeight) {
    logger.info(`GovernanceProposer ${eventName} logs up to date`);
    return 0n;
  }

  const actualToBlock = getActualToBlock(fromBlock, latestHeight, "finalized");
  setOverrideStoreHeight(getStoreHeightForRange(actualToBlock, latestHeight));
  const callbacks = callbacksFactory({
    isFinalized: GET_EVENTS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  });
  const getEvents = contract.getEvents as unknown as Record<
    string,
    GovernanceGetEventsFn
  >;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const logs = await getEvents[eventName]({}, { fromBlock, toBlock: actualToBlock });
  await callbacks.onLogs(logs);
  return latestHeight - getMemoryHeight();
};

export const getAllContractsEvents = async ({
  contracts,
  toBlock,
  latestHeight,
}: {
  contracts: AztecContracts;
  toBlock: "finalized";
  latestHeight: bigint;
}) => {
  const client = getPublicHttpClient();
  const rollupPollResults: bigint[] = await Promise.all([
    getRollupL2BlockProposedLogs({
      client,
      contracts,
      toBlock,
      latestHeight,
    }),
    getRollupL2ProofVerifiedLogs({
      client,
      contracts,
      toBlock,
      latestHeight,
    }),
    // NOTE: These events are not used in the current implementation, but are left here for future use. The reason for not using them is that they require our L1-RPC to be a full node (being able to query state at any given block).
    //getDepositLogs({
    //  client,
    //  contracts,
    //  toBlock,
    //  latestHeight,
    //}),
    //getWithdrawInitiatedLogs({
    //  client,
    //  contracts,
    //  toBlock,
    //  latestHeight,
    //}),
    //getWithdrawFinalisedLogs({
    //  client,
    //  contracts,
    //  toBlock,
    //  latestHeight,
    //}),
    //getSlashedLogs({
    //  client,
    //  contracts,
    //  toBlock,
    //  latestHeight,
    //}),
  ]);

  // Governance structured events (chunked catchup instead of single massive watchEvent sweep)
  const governancePollResults: bigint[] = await Promise.all([
    getGovernanceStructuredEventLogs({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "Proposed",
      latestHeight,
      callbacksFactory: proposedEventCallbacks,
    }),
    getGovernanceStructuredEventLogs({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "VoteCast",
      latestHeight,
      callbacksFactory: voteCastEventCallbacks,
    }),
    getGovernanceStructuredEventLogs({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "ProposalExecuted",
      latestHeight,
      callbacksFactory: proposalExecutedEventCallbacks,
    }),
    getGovernanceStructuredEventLogs({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "ProposalDropped",
      latestHeight,
      callbacksFactory: proposalDroppedEventCallbacks,
    }),
    getGovernanceStructuredEventLogs({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "ConfigurationUpdated",
      latestHeight,
      callbacksFactory: configurationUpdatedEventCallbacks,
    }),
    getGovernanceStructuredEventLogs({
      contract: contracts.governance,
      contractName: "governance",
      eventName: "GovernanceProposerUpdated",
      latestHeight,
      callbacksFactory: governanceProposerUpdatedEventCallbacks,
    }),
  ]);

  // GovernanceProposer structured events
  const governanceProposerPollResults: bigint[] = await Promise.all([
    getGovernanceProposerStructuredEventLogs({
      contract: contracts.governanceProposer,
      contractName: "governanceProposer",
      eventName: "SignalCast",
      latestHeight,
      callbacksFactory: signalCastEventCallbacks,
    }),
    getGovernanceProposerStructuredEventLogs({
      contract: contracts.governanceProposer,
      contractName: "governanceProposer",
      eventName: "PayloadSubmittable",
      latestHeight,
      callbacksFactory: payloadSubmittableEventCallbacks,
    }),
    getGovernanceProposerStructuredEventLogs({
      contract: contracts.governanceProposer,
      contractName: "governanceProposer",
      eventName: "PayloadSubmitted",
      latestHeight,
      callbacksFactory: payloadSubmittedEventCallbacks,
    }),
  ]);

  const genericPollResults = await getAllGenericContractEventLogs({
    contracts,
    latestHeight,
  });
  return [
    ...rollupPollResults,
    ...governancePollResults,
    ...governanceProposerPollResults,
    ...genericPollResults,
  ];
};
