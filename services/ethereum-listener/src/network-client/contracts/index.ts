import {
  FeeJuicePortalAbi,
  GovernanceAbi,
  GovernanceProposerAbi,
  InboxAbi,
  OutboxAbi,
  RegistryAbi,
  RollupAbi,
} from "@aztec/l1-artifacts";
import { controllers as dbControllers } from "../../svcs/database/index.js";
import {
  getLatestFinalizedHeight,
  getPublicHttpClient,
  getPublicWsClient,
} from "../client/index.js";
import { getAllContractsEvents } from "./get-events.js";
import {
  type AztecContracts,
  type UnwatchCallback,
  getTypedContract,
} from "./utils.js";
import { watchAllContractsEvents } from "./watch-events.js";
import { queryStakingStateAndEmitUpdates } from "../client/get-attester-view.js";

type L1ContractsTransport = "http" | "ws";

export const getL1Contracts = async ({
  transport = "http",
}: {
  transport?: L1ContractsTransport;
} = {}): Promise<AztecContracts> => {
  const dbContracts = await dbControllers.getL1Contracts();
  const publicClient =
    transport === "ws" ? getPublicWsClient() : getPublicHttpClient();

  // Resolve governance address from registry, then governanceProposer from governance
  const rollupContract = getTypedContract(
    RollupAbi,
    dbContracts.rollupAddress as `0x${string}`,
    publicClient,
  );
  const registryContract = getTypedContract(
    RegistryAbi,
    dbContracts.registryAddress as `0x${string}`,
    publicClient,
  );
  const governanceAddress = await registryContract.read.getGovernance();
  const governanceContract = getTypedContract(
    GovernanceAbi,
    governanceAddress,
    publicClient,
  );
  const governanceProposerAddress =
    await governanceContract.read.governanceProposer();
  const governanceProposerContract = getTypedContract(
    GovernanceProposerAbi,
    governanceProposerAddress,
    publicClient,
  );

  return {
    rollup: rollupContract,
    registry: getTypedContract(
      RegistryAbi,
      dbContracts.registryAddress as `0x${string}`,
      publicClient,
    ),
    inbox: getTypedContract(
      InboxAbi,
      dbContracts.inboxAddress as `0x${string}`,
      publicClient,
    ),
    outbox: getTypedContract(
      OutboxAbi,
      dbContracts.outboxAddress as `0x${string}`,
      publicClient,
    ),
    feeJuicePortal: getTypedContract(
      FeeJuicePortalAbi,
      dbContracts.feeJuicePortalAddress as `0x${string}`,
      publicClient,
    ),
    governance: governanceContract,
    governanceProposer: governanceProposerContract,
  };
};

export const startContractWatchers = async (): Promise<UnwatchCallback> => {
  const contracts = await getL1Contracts({ transport: "ws" });
  const latestHeight = await getLatestFinalizedHeight();
  return watchAllContractsEvents({ contracts, latestHeight });
};

export const getFinalizedContractEvents = async () => {
  const contracts = await getL1Contracts();
  const latestHeight = await getLatestFinalizedHeight();
  return getAllContractsEvents({
    contracts,
    latestHeight,
    toBlock: "finalized",
  });
};

export const getAttestersView = async () => {
  const contracts = await getL1Contracts();
  const latestHeight = await getLatestFinalizedHeight();
  return queryStakingStateAndEmitUpdates({
    contracts,
    latestHeight,
  });
};
