import { AztecNode, createAztecNodeClient } from "@aztec/aztec.js";
import { jsonStringify } from "@chicmoz-pkg/types";
import { AZTEC_RPC_URLS } from "../../../environment.js";
import { logger } from "../../../logger.js";

interface NodeConfig {
  id: string;
  url: string;
  node: AztecNode;
}

let nodePool: NodeConfig[] = [];
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
      id: node.name,
      url: node.url,
      node: createAztecNodeClient(node.url),
    };
  });
};

// Function to get the next AztecNode
export const getNextRpcNode = (): NodeConfig => {
  const node = nodePool[currentNodeIndex];
  logger.info(`🧋 Using node ${node.id}`);
  currentNodeIndex = (currentNodeIndex + 1) % nodePool.length;
  return node;
};

export const getCurrentRpcNodeUrl = () => {
  return nodePool[currentNodeIndex].url;
};

//TODO:Discuse if this is still necessary? Currently not being used
export const checkValidatorStats = async () => {
  try {
    const stats = await nodePool[0].node.getValidatorsStats();
    logger.info(`Validator stats: ${JSON.stringify(stats, null, 2)}`);
  } catch (e) {
    logger.warn(`Failed to fetch validator stats: ${(e as Error).message}`);
  }
};
