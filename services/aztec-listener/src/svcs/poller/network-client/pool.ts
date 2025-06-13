import { AztecNode, createAztecNodeClient } from "@aztec/aztec.js";
import { AZTEC_RPC_URLS } from "../../../environment.js";
import { onL2RpcNodeError } from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";

export interface RpcNode {
  name: string;
  url: string;
  instance: AztecNode;
}

let allNodes: RpcNode[] = [];
let onlinePool: RpcNode[] = [];
let offlinePool: RpcNode[] = [];
let currentNodeIndex = 0;

const resetPools = () => {
  logger.info(
    `⚠️ ⚠️ ⚠️  Resetting node pools (online: ${onlinePool.length}, offline: ${offlinePool.length})`,
  );
  onlinePool = allNodes.map((node) => node);
  offlinePool = [];
  currentNodeIndex = 0;
};

export const getAmountOfOnlineNodes = () => {
  return onlinePool.length;
};

export const initPool = () => {
  allNodes = AZTEC_RPC_URLS.map((node) => {
    return {
      name: node.name,
      url: node.url,
      instance: createAztecNodeClient(node.url),
    };
  });
  resetPools();
  setInterval(
    () => {
      resetPools();
    },
    60 * 60 * 1000,
  );
};

// Function to get the next AztecNode
export const getRpcNode = (): RpcNode => {
  if (onlinePool.length === 0) {
    throw new Error(
      "Node pool is empty. Ensure that initPool() has been called and the pool is properly initialized.",
    );
  }
  const node = onlinePool[currentNodeIndex];
  currentNodeIndex = (currentNodeIndex + 1) % onlinePool.length;
  return node;
};

export const getNodeUrls = (): string[] => {
  return onlinePool.map((node) => node.url);
};

export const checkValidatorStats = async () => {
  for (const node of onlinePool) {
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

export const setNodeOffline = <K extends keyof AztecNode>(
  node: RpcNode,
  fnName: K,
  e: unknown,
  args?: Parameters<AztecNode[K]>,
) => {
  const nodeAlreadyOffline = offlinePool.find(
    (n) => n.name === node.name && n.url === node.url,
  );
  if (!nodeAlreadyOffline) {
    offlinePool.push(node);
  }
  logger.warn(
    `⚠️ ⚠️ ⚠️  Node ${node.name} failed to call ${fnName} with args: ${JSON.stringify(args)}. ${
      (e as Error).cause ? `Cause: ${JSON.stringify((e as Error).cause)}` : ""
    } ${
      nodeAlreadyOffline
        ? "is already marked as offline."
        : "marking it as offline."
    }`,
  );
  onL2RpcNodeError(
    {
      name: (e as Error).name ?? "UnknownName",
      message: (e as Error).message ?? "UnknownMessage",
      cause: JSON.stringify((e as Error).cause) ?? "UnknownCause",
      stack: (e as Error).stack ?? "UnknownStack",
      data: { fnName, args, error: e },
      nodeName: node.name,
    },
    node.url,
  );
  onlinePool = onlinePool.filter(
    (n) => n.name !== node.name || n.url !== node.url,
  );
  currentNodeIndex = 0;
  if (onlinePool.length === 0) {
    logger.error("All nodes in the pool are offline. Resetting pools.");
    resetPools();
  }
};

export const getAllRpcNodes = (): RpcNode[] => {
  return allNodes;
};
