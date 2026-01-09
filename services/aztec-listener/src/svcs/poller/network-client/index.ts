/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { deriveStorageSlotInMap } from "@aztec/stdlib/hash";
import {
  ChicmozChainInfo,
  ChicmozL2Sequencer,
  NODE_ENV,
  NodeEnv,
} from "@chicmoz-pkg/types";
import { backOff } from "exponential-backoff";
import {
  L2_NETWORK_ID,
  MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS,
} from "../../../environment.js";
import {
  onChainInfo,
  onL2RpcNodeAlive,
  onL2SequencerInfo,
} from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";
import {
  getAllRpcNodes,
  getAmountOfOnlineNodes,
  getRpcNode,
  initPool,
  RpcNode,
  setNodeOffline,
} from "./pool.js";
import {
  getChicmozChainInfoFromNodeInfo,
  getSequencerFromNodeInfo,
} from "./utils.js";
import { AztecNode, NodeInfo } from "@aztec/aztec.js/node";
import { AztecAddress } from "@aztec/stdlib/aztec-address";
import { Fr } from "@aztec/aztec.js/fields";
import { ProtocolContractAddress } from "@aztec/aztec.js/protocol";
import { BlockNumber } from "@aztec/foundation/branded-types";

const offlineCauses = ["Service Unavailable", "Unauthorized", "Bad Gateway"];

const callNodeFunction = async <K extends keyof AztecNode>(
  fnName: K,
  args?: Parameters<AztecNode[K]>,
  forceNode?: RpcNode,
): Promise<ReturnType<AztecNode[K]>> => {
  let currentNode = forceNode ?? getRpcNode();
  const res = await backOff(
    async () => {
      logger.info(
        `🧋 Calling Aztec node function: ${fnName} on ${currentNode.name}`,
      );
      // eslint-disable-next-line @typescript-eslint/ban-types
      const result = (await (currentNode.instance[fnName] as Function).apply(
        currentNode.instance,
        args,
      )) as Promise<ReturnType<AztecNode[K]>>;
      void onL2RpcNodeAlive(currentNode.url, currentNode.name);
      return result;
    },
    {
      numOfAttempts: getAmountOfOnlineNodes(),
      maxDelay: 2000,
      startingDelay: 200,
      retry: (e, attemptNumber: number) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorCode = e.cause?.code;
        const isRetriableDevelopmentError =
          errorCode === "ECONNREFUSED" || errorCode === "ENOTFOUND";
        if (NODE_ENV === NodeEnv.DEV && isRetriableDevelopmentError) {
          logger.warn(
            `🤡🤡 Aztec connection refused or not found, retrying attempt ${attemptNumber}...`,
          );
          return true;
        }
        if (
          (
            e as {
              cause?: { message: string; code?: number };
            }
          ).cause?.message &&
          offlineCauses.some((cause) =>
            (e as { cause?: { message: string } }).cause?.message.includes(
              cause,
            ),
          )
        ) {
          setNodeOffline(currentNode, fnName, e, args);
          if (forceNode) {
            return false;
          }
        }
        currentNode = forceNode ?? getRpcNode();
        return true;
      },
    },
  );
  return res;
};

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const init = async () => {
  initPool();
  await sleep(1000);
  return getFreshInfo();
};

export const getFreshInfo = async (): Promise<{
  chainInfo: ChicmozChainInfo;
  sequencers: ChicmozL2Sequencer[];
}> => {
  const allNodes = getAllRpcNodes();
  if (allNodes.length === 0) {
    throw new Error("No Aztec nodes available in the pool");
  }
  let chainInfo: ChicmozChainInfo | undefined = undefined;
  const sequencers: ChicmozL2Sequencer[] = [];
  for (const node of allNodes) {
    try {
      const {
        nodeVersion,
        l1ChainId,
        rollupVersion,
        enr,
        l1ContractAddresses,
        protocolContractAddresses,
      } = await callNodeFunction("getNodeInfo", undefined, node);
      const nodeInfo: NodeInfo = {
        nodeVersion,
        l1ChainId,
        rollupVersion,
        enr,
        l1ContractAddresses: l1ContractAddresses,
        protocolContractAddresses: protocolContractAddresses,
      };
      const cInfo = getChicmozChainInfoFromNodeInfo(L2_NETWORK_ID, nodeInfo);
      if (!chainInfo || chainInfo.rollupVersion < cInfo.rollupVersion) {
        await onChainInfo(cInfo).catch((e) => {
          logger.error(
            `Aztec failed to publish chain info: ${(e as Error).message}`,
          );
        });
        chainInfo = cInfo;
      }

      const sequencer = getSequencerFromNodeInfo(
        L2_NETWORK_ID,
        node.url,
        nodeInfo,
      );
      sequencers.push(sequencer);

      await onL2SequencerInfo(sequencer).catch((e) => {
        logger.error(
          `Aztec failed to publish sequencer info: ${(e as Error).message}`,
        );
      });
    } catch (e) {
      logger.error(
        `Failed to fetch node info from ${node.name}: ${(e as Error).stack}`,
      );
      continue;
    }
  }

  if (!chainInfo) {
    throw new Error("Failed to fetch chain info from any Aztec node");
  }

  return {
    chainInfo,
    sequencers,
  };
};

export const getBlock = async (height: number) =>
  callNodeFunction("getBlock", [BlockNumber(height)]);

export const getBlocks = async (fromHeight: number, toHeight: number) => {
  if (toHeight - fromHeight > MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS) {
    throw new Error("Too many blocks to fetch");
  }
  const blocks = [];
  for (let i = fromHeight; i < toHeight; i++) {
    if (NODE_ENV === NodeEnv.DEV) {
      await new Promise((r) => setTimeout(r, 500));
    } else {
      await new Promise((r) => setTimeout(r, 200));
    }
    const block = await getBlock(i);
    blocks.push(block);
  }

  return blocks;
};

export const getLatestProposedHeight = async () => {
  return callNodeFunction("getBlockNumber");
};

export const getLatestProvenHeight = async () => {
  return await callNodeFunction("getProvenBlockNumber");
};

export const getPendingTxs = async () => callNodeFunction("getPendingTxs");

export const getBalanceOf = async (
  blockNumber: number | "latest",
  address: AztecAddress,
) => {
  const slot = await deriveStorageSlotInMap(new Fr(1), address);
  const blockParam =
    blockNumber === "latest" ? "latest" : BlockNumber(blockNumber);
  return callNodeFunction("getPublicStorageAt", [
    blockParam,
    ProtocolContractAddress.FeeJuice,
    slot,
  ]);
};
