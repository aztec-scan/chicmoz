import { RollupAbi } from "@aztec/l1-artifacts";
import { L2NetworkId, getL1NetworkId } from "@chicmoz-pkg/types";
import {
  PublicClient,
  createPublicClient,
  defineChain,
  http,
  maxInt256,
  webSocket,
} from "viem";
import { foundry, mainnet, sepolia } from "viem/chains";
import {
  ETHEREUM_ALCHEMY_HTTP_URL,
  ETHEREUM_HTTP_RPC_URL,
  ETHEREUM_WS_RPC_URL,
  L2_NETWORK_ID,
} from "../../environment.js";
import { logger } from "../../logger.js";
import { getL1Contracts } from "../contracts/index.js";
import { getCachedBlockTimestamp } from "./cached-block-timestamps.js";
export { startContractWatchers as watchContractsEvents } from "../contracts/index.js";

let publicWsClient: PublicClient | undefined = undefined;
let publicHttpClient: PublicClient | undefined = undefined;
let publicHttpBackupClient: PublicClient | undefined = undefined;

export const getPublicWsClient = () => {
  if (!publicWsClient) {
    throw new Error("Client not initialized");
  }
  return publicWsClient;
};

export const getPublicHttpClient = () => {
  if (!publicHttpClient) {
    throw new Error("Client not initialized");
  }
  return publicHttpClient;
};

export const getPublicHttpBackupClient = () => publicHttpBackupClient;

export const initClient = () => {
  let chainConf;
  switch (getL1NetworkId(L2_NETWORK_ID)) {
    case "ETH_MAINNET":
      chainConf = mainnet;
      break;
    case "ETH_SEPOLIA":
      chainConf = sepolia;
      break;
    default:
      chainConf = foundry;
  }
  const chain = defineChain({
    ...chainConf,
    rpcUrls: {
      default: {
        http: [ETHEREUM_HTTP_RPC_URL],
        webSocket: [ETHEREUM_WS_RPC_URL],
      },
    },
  });
  publicWsClient = createPublicClient({
    chain,
    transport: webSocket(),
  });
  publicHttpClient = createPublicClient({ chain, transport: http() });
  if (ETHEREUM_ALCHEMY_HTTP_URL) {
    publicHttpBackupClient = createPublicClient({
      chain,
      transport: http(ETHEREUM_ALCHEMY_HTTP_URL),
    });
  }
};

export const getLatestFinalizedHeight = async () => {
  const block = await getPublicHttpClient().getBlock({
    blockTag: "finalized",
  });
  //const latest = await getPublicHttpClient().getBlockNumber();
  //logger.info(`Two blocks: latest=${latest}, finalized=${block.number}`);
  return block.number;
};

export const getBlock = async (blockNumber: number | bigint) => {
  return await getPublicHttpClient().getBlock({
    blockNumber: BigInt(blockNumber),
  });
};

export const getBlockTimestamp = async (
  blockNumber: number | bigint | null,
) => {
  if (!blockNumber) {
    return null;
  }
  return getCachedBlockTimestamp(blockNumber, getBlock);
};

export const getEarliestRollupBlockNumber = async () => {
  const l1Contracts = await getL1Contracts();
  if (!l1Contracts) {
    throw new Error("Contracts not initialized");
  }
  const cacheKey = `${L2_NETWORK_ID}:${l1Contracts.rollup.address.toLowerCase()}`;
  const cached = earliestRollupBlockNumberCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const discovered = discoverEarliestRollupBlockNumber(
    l1Contracts.rollup.address,
  ).catch((error) => {
    earliestRollupBlockNumberCache.delete(cacheKey);
    throw error;
  });
  earliestRollupBlockNumberCache.set(cacheKey, discovered);
  return discovered;
};

const earliestRollupBlockNumberCache = new Map<string, Promise<bigint>>();

const discoverEarliestRollupBlockNumber = async (
  rollupAddress: `0x${string}`,
) => {
  const hardcodedValue = hardcodedRollupGenesisBlocks(
    rollupAddress,
    L2_NETWORK_ID,
  );
  if (hardcodedValue > 0n) {
    return hardcodedValue;
  }

  let end = await getLatestFinalizedHeight();
  let start = 0n;
  logger.info(`Searching for tips time between blocks ${start} and ${end}`);
  let foundRollupBlockNumber = maxInt256;
  while (start < end) {
    const blockNbr = (start + end) / 2n;
    try {
      await getPublicHttpClient().readContract({
        address: rollupAddress,
        abi: RollupAbi,
        functionName: "getTips",
        blockNumber: BigInt(blockNbr),
      });
      foundRollupBlockNumber = BigInt(blockNbr);
      end = BigInt(blockNbr);
    } catch (e) {
      if (isPreDeployReadError(e)) {
        start = BigInt(blockNbr) + 1n;
      } else {
        throw e;
      }
    }
  }
  if (foundRollupBlockNumber === maxInt256) {
    logger.info(
      `No proven block number found, using hardcoded value ${hardcodedValue}`,
    );
    return hardcodedValue;
  } else {
    const betterSafeThanSorry = 100n;
    return start > betterSafeThanSorry ? start - betterSafeThanSorry : 0n;
  }
};

const isPreDeployReadError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Missing or invalid parameters") ||
    error.message.includes("returned no data") ||
    error.message.includes("could not decode result data") ||
    error.message.includes("ContractFunctionExecutionError")
  );
};

const hardcodedRollupGenesisBlocks = (
  rollupAddress: `0x${string}`,
  networkId: L2NetworkId,
): bigint => {
  // NOTE: these values are manually looked up from etherscan
  logger.info(
    `Hardcoded rollup genesis block for ${rollupAddress} on ${networkId}`,
  );
  if (
    networkId === "TESTNET"
  ) {
    switch (rollupAddress.toLowerCase()) {
      case "0xebd99ff0ff6677205509ae73f93d0ca52ac85d67":
        return 8125387n;
      case "0xf6d0d42ace06829becb78c74f49879528fc632c1":
        return 10391387n;
      default:
        return 8125387n; // NOTE: probably it will never be a lower block than this on sepolia
    }
  } else if (
    networkId === "DEVNET"
  ) {
    switch (rollupAddress.toLowerCase()) {
      case "0xcd1a7be18501092f3ba8d80ce5629501ba178de0":
        return 10286799n;
      default:
        return 10286799n; // NOTE: probably it will never be a lower block than this on foundry
    }
  } else if (
    networkId === "MAINNET"
  ) {
    switch (rollupAddress.toLowerCase()) {
      case "0xae2001f7e21d5ecabf6234e9fdd1e76f50f74962":
        return 24586322n;
      default:
        return 24586322n; // NOTE: probably it will never be a lower block than this on mainnet
    }
  }
  // Fallback for unknown networks
  return 0n;
};
