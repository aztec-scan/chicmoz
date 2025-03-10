import { RollupAbi } from "@aztec/l1-artifacts";
import {
  ChicmozL1L2Validator,
  NODE_ENV,
  NodeEnv,
  chicmozL1L2ValidatorSchema,
  getL1NetworkId,
} from "@chicmoz-pkg/types";
import {
  PublicClient,
  createPublicClient,
  defineChain,
  http,
  webSocket,
} from "viem";
import { foundry, mainnet, sepolia } from "viem/chains";
import {
  ETHEREUM_HTTP_RPC_URL,
  ETHEREUM_WS_RPC_URL,
  L2_NETWORK_ID,
} from "../environment.js";
import { emit } from "../events/index.js";
import { logger } from "../logger.js";
import { getL1Contracts } from "./contracts/index.js";
export { startContractWatchers as watchContractsEvents } from "./contracts/index.js";

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

export const getBlock = async (blockNumber: number) => {
  return await getPublicHttpClient().getBlock({
    blockNumber: BigInt(blockNumber),
  });
};

const json = (param: unknown): string => {
  return JSON.stringify(
    param,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );
};

export const emitRandomizedChangeWithinRandomizedTime = async (
  depth: number,
  oldValues: ChicmozL1L2Validator,
) => {
  if (depth === 0) {
    return;
  }
  const rand = Math.random();
  const sleepTime = 30000;
  logger.info(
    `ATTESTER ${oldValues.attester} - DEPTH ${depth} - SLEEP ${
      sleepTime / 1000
    }s`,
  );
  await new Promise((resolve) => setTimeout(resolve, sleepTime));
  let newValues = oldValues;
  if (rand < 0.25) {
    const stake = BigInt(Math.floor(Math.random() * 100000000));
    logger.info(`STAKE CHANGED: ${oldValues.stake} -> ${stake}`);
    newValues = {
      ...oldValues,
      stake,
      latestSeenChangeAt: new Date(),
    };
  } else if (rand < 0.5) {
    const status = [0, 1, 2, 3][Math.floor(Math.random() * 4)];
    logger.info(`STATUS CHANGED: ${oldValues.status} -> ${status}`);
    newValues = {
      ...oldValues,
      status,
      latestSeenChangeAt: new Date(),
    };
  } else if (rand < 0.75) {
    const withdrawer = oldValues.withdrawer
      .slice(0, -Math.floor(rand * 5))
      .padEnd(42, ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)]);
    logger.info(`WITHDRAWER CHANGED: ${oldValues.withdrawer} -> ${withdrawer}`);
    newValues = {
      ...oldValues,
      withdrawer,
      latestSeenChangeAt: new Date(),
    };
  } else {
    const proposer = oldValues.proposer
      .slice(0, -Math.floor(rand * 5))
      .padEnd(42, ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)]);
    logger.info(`PROPOSER CHANGED: ${oldValues.proposer} -> ${proposer}`);
    newValues = {
      ...oldValues,
      proposer,
      latestSeenChangeAt: new Date(),
    };
  }
  await emit.l1Validator(newValues);
  await emitRandomizedChangeWithinRandomizedTime(depth - 1, newValues);
};

export const queryStakingStateAndEmitUpdates = async () => {
  // TODO: this entire function should be replaced with a watch on the contract (and some initial state query)
  const l1Contracts = await getL1Contracts();
  if (!l1Contracts) {
    throw new Error("Contracts not initialized");
  }
  const attesterCount = await getPublicHttpClient().readContract({
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    address: l1Contracts.rollup.address as `0x${string}`,
    abi: RollupAbi,
    functionName: "getActiveAttesterCount",
  });
  logger.info(`Active attester count: ${attesterCount.toString()}`);
  if (attesterCount > 0) {
    for (let i = 0; i < attesterCount; i++) {
      const attester = await getPublicHttpClient().readContract({
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        address: l1Contracts.rollup.address as `0x${string}`,
        abi: RollupAbi,
        functionName: "getAttesterAtIndex",
        args: [BigInt(i)],
      });
      const attesterInfo = await getPublicHttpClient().readContract({
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        address: l1Contracts.rollup.address as `0x${string}`,
        abi: RollupAbi,
        functionName: "getInfo",
        args: [attester],
      });
      logger.info(`Attester ${i}: ${json(attesterInfo)}`);
      await emit.l1Validator(
        chicmozL1L2ValidatorSchema.parse({
          ...attesterInfo,
          attester,
        }),
      );
    }
  } else {
    if (NODE_ENV === NodeEnv.DEV) {
      logger.info("Mocking dev attesters");
      const mockedAttesters = [
        {
          attester: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          stake: BigInt(100000000),
          status: 0,
          withdrawer: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          proposer: "0xcccccccccccccccccccccccccccccccccccccccc",
          latestSeenChangeAt: new Date(),
        },
        {
          attester: "0x1111111111111111111111111111111111111111",
          stake: BigInt(200000000),
          status: 1,
          withdrawer: "0x2222222222222222222222222222222222222222",
          proposer: "0x3333333333333333333333333333333333333333",
        },
      ];
      for (const attesterInfo of mockedAttesters) {
        await emit.l1Validator(
          chicmozL1L2ValidatorSchema.parse({
            ...attesterInfo,
            attester: attesterInfo.attester,
          }),
        );
      }
      for (const attesterInfo of mockedAttesters) {
        await emitRandomizedChangeWithinRandomizedTime(
          100,
          chicmozL1L2ValidatorSchema.parse(attesterInfo),
        ).catch((e) => {
          logger.error(
            `Randomized change emission failed: ${(e as Error).stack}`,
          );
        });
      }
    }
  }
};
