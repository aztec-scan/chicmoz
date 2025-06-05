import { AztecNode, createAztecNodeClient } from "@aztec/aztec.js";
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

export const checkValidatorStats = async () => {
  try {
    const stats = await nodePool[0].instance.getValidatorsStats(); // WARN: this is fragile because it by convention needs the first node in the array to have validator-stats enabled.
    logger.info(`Validator stats: ${JSON.stringify(stats, null, 2)}`);
  } catch (e) {
    logger.warn(`Failed to fetch validator stats: ${(e as Error).message}`);
  }
};
