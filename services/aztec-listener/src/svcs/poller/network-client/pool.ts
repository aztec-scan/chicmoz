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
  currentNodeIndex = 0;
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
  if (nodePool.length === 0) {
    throw new Error(
      "Node pool is empty. Ensure that initPool() has been called and the pool is properly initialized.",
    );
  }
  const node = nodePool[currentNodeIndex];
  logger.info(`🧋 Using node ${node.name}`);
  currentNodeIndex = (currentNodeIndex + 1) % nodePool.length;
  return node;
};

export const getNodeUrls = (): string[] => {
  return nodePool.map((node) => node.url);
};

export const checkValidatorStats = async () => {
  for (const node of nodePool) {
    try {
      const stats = await node.instance.getValidatorsStats();
      logger.info(
        `Validator stats from node ${node.name}: ${JSON.stringify(stats, null, 2)}`,
      );
      return;
    } catch (e) {
      logger.warn(
        `Node ${node.name} failed to fetch validator stats: ${(e as Error).message}`,
      );
    }
  }
  logger.warn("No nodes in the pool were able to provide validator stats.");
};
