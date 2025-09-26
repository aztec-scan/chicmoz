import {
  FeeJuicePortalAbi,
  InboxAbi,
  OutboxAbi,
  RegistryAbi,
  RollupAbi,
} from "@aztec/l1-artifacts";
import { controllers as dbControllers } from "../../svcs/database/index.js";
import {
  getLatestFinalizedHeight,
  getPublicHttpClient,
} from "../client/index.js";
import { getAllContractsEvents } from "./get-events.js";
import { AztecContracts, UnwatchCallback, getTypedContract } from "./utils.js";
import { watchAllContractsEvents } from "./watch-events.js";
import { queryStakingStateAndEmitUpdates } from "../client/get-attester-view.js";

export const getL1Contracts = async (): Promise<AztecContracts> => {
  const dbContracts = await dbControllers.getL1Contracts();
  const publicClient = getPublicHttpClient();
  return {
    rollup: getTypedContract(
      RollupAbi,
      dbContracts.rollupAddress as `0x${string}`,
      publicClient,
    ),
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
      dbContracts.feeJuiceAddress as `0x${string}`,
      publicClient,
    ),
  };
};

export const startContractWatchers = async (): Promise<UnwatchCallback> => {
  const contracts = await getL1Contracts();
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
