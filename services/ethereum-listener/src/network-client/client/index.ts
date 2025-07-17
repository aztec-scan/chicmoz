import { RollupAbi } from "@aztec/l1-artifacts";
import {
  ChicmozL1L2Validator,
  L2NetworkId,
  chicmozL1L2ValidatorSchema,
  getL1NetworkId,
} from "@chicmoz-pkg/types";
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
  ETHEREUM_HTTP_RPC_URL,
  ETHEREUM_WS_RPC_URL,
  L2_NETWORK_ID,
} from "../../environment.js";
import { emit } from "../../events/index.js";
import { logger } from "../../logger.js";
import { getL1Contracts } from "../contracts/index.js";
import { AztecContracts } from "../contracts/utils.js";
import { getCachedBlockTimestamp } from "./cached-block-timestamps.js";
export { startContractWatchers as watchContractsEvents } from "../contracts/index.js";

let publicWsClient: PublicClient | undefined = undefined;
let publicHttpClient: PublicClient | undefined = undefined;

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
  let end = await getLatestFinalizedHeight();
  let start = 0n;
  logger.info(`Searching for tips time between blocks ${start} and ${end}`);
  let foundL2ProvenBlockNumber = maxInt256;
  while (start < end) {
    const blockNbr = (start + end) / 2n;
    try {
      const res = await getPublicHttpClient().readContract({
        address: l1Contracts.rollup.address,
        abi: RollupAbi,
        functionName: "getTips",
        blockNumber: BigInt(blockNbr),
      });
      if (res.provenBlockNumber === 0n) {
        start = BigInt(blockNbr);
        foundL2ProvenBlockNumber = BigInt(blockNbr);
      }
      end = BigInt(blockNbr);
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes("Missing or invalid parameters")
      ) {
        start = BigInt(blockNbr) + 1n;
      } else {
        throw e;
      }
    }
  }
  if (foundL2ProvenBlockNumber === maxInt256) {
    const hardcodedValue = hardcodedRollupGenesisBlocks(
      l1Contracts.rollup.address,
      L2_NETWORK_ID,
    );
    logger.info(
      `No proven block number found, using hardcoded value ${hardcodedValue}`,
    );
    return hardcodedValue;
  } else {
    const betterSafeThanSorry = 100n;
    return start - betterSafeThanSorry;
  }
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
    networkId === "TESTNET" &&
    rollupAddress.toLowerCase() === "0xee6d4e937f0493fb461f28a75cf591f1dba8704e"
  ) {
    return 8125387n;
  }
  return 0n;
};

let latestPublishedHeight = 0n;

export const queryStakingStateAndEmitUpdates = async ({
  contracts,
  latestHeight,
}: {
  contracts: AztecContracts;
  latestHeight: bigint;
}) => {
  if (latestHeight <= latestPublishedHeight) {
    logger.info(
      `Latest height ${latestHeight} <= latest published height ${latestPublishedHeight}`,
    );
    return;
  }
  const attesterCount = await getPublicHttpClient().readContract({
    address: contracts.rollup.address,
    abi: RollupAbi,
    blockNumber: latestHeight,
    functionName: "getActiveAttesterCount",
  });
  const attesters = await getPublicHttpClient().readContract({
    address: contracts.rollup.address,
    abi: RollupAbi,
    functionName: "getAttesters",
    args: [],
  });
  logger.info(
    `Active attester count: ${attesterCount.toString()} (${attesters.length})`,
  );
  const attesterInfos: ChicmozL1L2Validator[] = [];
  for (const attester of attesters) {
    const attesterInfo = await getPublicHttpClient().readContract({
      address: contracts.rollup.address,
      abi: RollupAbi,
      functionName: "getAttesterView",
      args: [attester],
    });
    if (attesterInfo === undefined) {
      logger.warn(`Attester ${attester} not found`);
      continue;
    }
    attesterInfos.push(
      chicmozL1L2ValidatorSchema.parse({
        ...attesterInfo,
        rollupAddress: contracts.rollup.address,
        attester,
      }),
    );
  }
  await emit.l1Validator(attesterInfos);
  latestPublishedHeight = latestHeight;
};
