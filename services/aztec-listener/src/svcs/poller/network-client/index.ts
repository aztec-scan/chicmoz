/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AztecNode, NodeInfo, createAztecNodeClient } from "@aztec/aztec.js";
import {
  ChicmozChainInfo,
  ChicmozL2Sequencer,
  NODE_ENV,
  NodeEnv,
  l2NetworkIdSchema,
} from "@chicmoz-pkg/types";
import { IBackOffOptions, backOff } from "exponential-backoff";
import {
  AZTEC_RPC_URL,
  L2_NETWORK_ID,
  MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS,
} from "../../../environment.js";
import {
  onChainInfo,
  onL2RpcNodeAlive,
  onL2RpcNodeError,
  onL2SequencerInfo,
} from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";
import {
  getChicmozChainInfoFromNodeInfo,
  getSequencerFromNodeInfo,
} from "./utils.js";

let aztecNode: AztecNode;

const backOffOptions: Partial<IBackOffOptions> = {
  numOfAttempts: 5,
  maxDelay: 10000,
  startingDelay: 2000,
  retry: (e, attemptNumber: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const errorCode = e.cause?.code;
    const isRetriableProductionError = errorCode === "ECONNRESET";
    const isRetriableDevelopmentError =
      errorCode === "ECONNREFUSED" || errorCode === "ENOTFOUND";
    if (isRetriableProductionError) {
      logger.warn(
        `🤡 Aztec connection reset, retrying attempt ${attemptNumber}...`,
      );
      return true;
    } else if (NODE_ENV === NodeEnv.DEV && isRetriableDevelopmentError) {
      logger.warn(
        `🤡🤡 Aztec connection refused or not found, retrying attempt ${attemptNumber}...`,
      );
      return true;
    }

    return false;
  },
};

const node = () => {
  if (!aztecNode) {
    throw new Error("Node not initialized");
  }
  return aztecNode;
};

const callNodeFunction = async <K extends keyof AztecNode>(
  fnName: K,
  args?: Parameters<AztecNode[K]>,
): Promise<ReturnType<AztecNode[K]>> => {
  try {
    const res = await backOff(async () => {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (await (node()[fnName] as Function).apply(
        node(),
        args,
      )) as Promise<ReturnType<AztecNode[K]>>;
    }, backOffOptions);
    onL2RpcNodeAlive(AZTEC_RPC_URL);
    return res;
  } catch (e) {
    logger.warn(`Aztec failed to call ${fnName}`);
    onL2RpcNodeError({
      name: (e as Error).name ?? "UnknownName",
      message: (e as Error).message ?? "UnknownMessage",
      cause: JSON.stringify((e as Error).cause) ?? "UnknownCause",
      stack: (e as Error).stack ?? "UnknownStack",
      data: { fnName, args, error: e },
    });
    if ((e as Error).cause) {
      logger.warn(
        `Aztec failed to fetch: ${JSON.stringify((e as Error).cause)}`,
      );
    }
    throw e;
  }
};

const checkValidatorStats = async () => {
  try {
    const stats = await aztecNode.getValidatorsStats();
    logger.info(`Validator stats: ${JSON.stringify(stats, null, 2)}`);
  } catch (e) {
    logger.warn(`Failed to fetch validator stats: ${(e as Error).message}`);
  }
};

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const init = async () => {
  logger.info(`Initializing Aztec node client with ${AZTEC_RPC_URL}`);
  aztecNode = createAztecNodeClient(AZTEC_RPC_URL);
  await checkValidatorStats();
  await sleep(1000);
  return getFreshInfo();
};

export const getFreshInfo = async (): Promise<{
  chainInfo: ChicmozChainInfo;
  sequencer: ChicmozL2Sequencer;
}> => {
  const {
    nodeVersion,
    l1ChainId,
    rollupVersion,
    enr,
    l1ContractAddresses,
    protocolContractAddresses,
  } = await callNodeFunction("getNodeInfo");
  const nodeInfo: NodeInfo = {
    nodeVersion,
    l1ChainId,
    rollupVersion,
    enr:
      enr ?? L2_NETWORK_ID === l2NetworkIdSchema.enum.SANDBOX // NOTE: this is to anonymize the node
        ? L2_NETWORK_ID
        : undefined,
    l1ContractAddresses: l1ContractAddresses,
    protocolContractAddresses: protocolContractAddresses,
  };
  logger.info(`🧋 ${JSON.stringify(nodeInfo, null, 2)}`);

  const chainInfo = getChicmozChainInfoFromNodeInfo(L2_NETWORK_ID, nodeInfo);
  onChainInfo(chainInfo).catch((e) => {
    logger.error(`Aztec failed to publish chain info: ${(e as Error).message}`);
  });
  const sequencer = getSequencerFromNodeInfo(
    L2_NETWORK_ID,
    AZTEC_RPC_URL,
    nodeInfo,
  );
  onL2SequencerInfo(sequencer).catch((e) => {
    logger.error(
      `Aztec failed to publish sequencer info: ${(e as Error).message}`,
    );
  });

  return {
    chainInfo,
    sequencer,
  };
};

export const getBlock = async (height: number) =>
  callNodeFunction("getBlock", [height]);

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
