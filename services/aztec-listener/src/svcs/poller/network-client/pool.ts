import { AztecNode, createAztecNodeClient } from "@aztec/aztec.js";
import { jsonStringify } from "@chicmoz-pkg/types";
import { AZTEC_RPC_URLS } from "../../../environment.js";
import { logger } from "../../../logger.js";

interface RpcNode {
  name: string;
  url: string;
  instance: AztecNode;
}

let nodePool: RpcNode[] = [];
let currentNodeIndex = 0;

// init() get a list of node urls from  env variables
export const initPool = () => {
  logger.info(
    `Initializing Aztec node pool with clients ${jsonStringify(
      AZTEC_RPC_URLS,
    )}`,
  );
  nodePool = AZTEC_RPC_URLS.map((node) => {
    return {
      name: node.name,
      url: node.url,
      instance: createAztecNodeClient(node.url),
    };
  });
};

// Function to get the next AztecNode
export const getRpcNode = (): RpcNode => {
  const node = nodePool[currentNodeIndex];
  logger.info(`🧋 Using node ${node.name}`);
  currentNodeIndex = (currentNodeIndex + 1) % nodePool.length;
  return node;
};

export const getNodeUrls = (): string[] => {
  return nodePool.map((node) => node.url);
};

//TODO:Discuse if this is still necessary? Currently not being used
export const checkValidatorStats = async () => {
  try {
    const stats = await nodePool[0].instance.getValidatorsStats();
    logger.info(`Validator stats: ${JSON.stringify(stats, null, 2)}`);
  } catch (e) {
    logger.warn(`Failed to fetch validator stats: ${(e as Error).message}`);
  }
};
