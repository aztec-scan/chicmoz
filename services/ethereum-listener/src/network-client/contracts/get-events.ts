import { PublicClient } from "viem";
import { logger } from "../../logger.js";
import { controllers as dbControllers } from "../../svcs/database/index.js";
import { getPublicHttpClient } from "../client/index.js";
import {
  l2BlockProposedEventCallbacks,
  l2ProofVerifiedEventCallbacks,
} from "./callbacks/rollup.js";
import { AztecContracts } from "./utils.js";

const GET_EVENETS_DEFAULT_IS_FINALIZED = true;
export const DEFAULT_BLOCK_CHUNK_SIZE = 500n;

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
    eventName: "L2BlockProposed",
    isFinalized: GET_EVENETS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  if (fromBlock >= latestHeight) {
    logger.info("Rollup L2BlockProposed logs up to date");
    return 0n;
  }
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  if (actualToBlock !== toBlock) {
    setOverrideStoreHeight(actualToBlock);
  }
  const rollupL2BlockProposedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "L2BlockProposed",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  l2BlockProposedEventCallbacks({
    isFinalized: GET_EVENETS_DEFAULT_IS_FINALIZED,
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
    isFinalized: GET_EVENETS_DEFAULT_IS_FINALIZED,
    latestHeight,
  });
  const actualToBlock = getActualToBlock(fromBlock, latestHeight, toBlock);
  if (actualToBlock !== toBlock) {
    setOverrideStoreHeight(actualToBlock);
  }
  const rollupL2ProofVerifiedLogs = await client.getContractEvents({
    fromBlock,
    toBlock: actualToBlock,
    eventName: "L2ProofVerified",
    address: contracts.rollup.address,
    abi: contracts.rollup.abi,
  });
  l2ProofVerifiedEventCallbacks({
    isFinalized: GET_EVENETS_DEFAULT_IS_FINALIZED,
    updateHeight,
    storeHeight,
  }).onLogs(rollupL2ProofVerifiedLogs);
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
  const pollResults: bigint[] = await Promise.all([
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
  ]);
  return pollResults;
};
