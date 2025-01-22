/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AztecNode, NodeInfo, createAztecNodeClient } from "@aztec/aztec.js";
import { NODE_ENV } from "@chicmoz-pkg/microservice-base";
import { chicmozL2RpcNodeErrorSchema } from "@chicmoz-pkg/types";
import { IBackOffOptions, backOff } from "exponential-backoff";
import {
  AZTEC_RPC_URL,
  MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS,
} from "../../environment.js";
import {
  onL2RpcNodeAlive,
  onL2RpcNodeError,
} from "../../events/emitted/index.js";
import { logger } from "../../logger.js";

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
        `🤡 Aztec connection reset, retrying attempt ${attemptNumber}...`
      );
      return true;
    } else if (NODE_ENV === "development" && isRetriableDevelopmentError) {
      logger.warn(
        `🤡🤡 Aztec connection refused or not found, retrying attempt ${attemptNumber}...`
      );
      return true;
    }

    return false;
  },
};

const node = () => {
  if (!aztecNode) throw new Error("Node not initialized");
  return aztecNode;
};

const callNodeFunction = async <K extends keyof AztecNode>(
  fnName: K,
  args?: Parameters<AztecNode[K]>
): Promise<ReturnType<AztecNode[K]>> => {
  try {
    const res = await backOff(async () => {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (await (node()[fnName] as Function).apply(
        node(),
        args
      )) as Promise<ReturnType<AztecNode[K]>>;
    }, backOffOptions);
    await onL2RpcNodeAlive(AZTEC_RPC_URL);
    return res;
  } catch (e) {
    logger.warn(`Aztec failed to call ${fnName}`);
    await onL2RpcNodeError(
      chicmozL2RpcNodeErrorSchema.parse({
        rpcUrl: AZTEC_RPC_URL,
        name: (e as Error).name ?? "UnknownName",
        message: (e as Error).message ?? "UnknownMessage",
        cause: (e as Error).cause ?? "UnknownCause",
        stack: (e as Error).stack ?? "UnknownStack",
        data: { fnName, args, error: e },
      })
    );
    if ((e as Error).cause) {
      logger.warn(
        `Aztec failed to fetch: ${JSON.stringify((e as Error).cause)}`
      );
    }
    throw e;
  }
};

export const init = async () => {
  logger.info(`Initializing Aztec node client with ${AZTEC_RPC_URL}`);
  aztecNode = createAztecNodeClient(AZTEC_RPC_URL);
  return getFreshNodeInfo();
};

export const getFreshNodeInfo = async () => {
  const nodeVersion = await callNodeFunction("getNodeVersion");
  logger.info(`🧋 Aztec node version: ${nodeVersion}`);
  const protocolVersion = await callNodeFunction("getVersion");
  logger.info(`🧋 Aztec protocol version: ${protocolVersion}`);
  const chainId = await callNodeFunction("getChainId");
  logger.info(`🧋 Aztec chain id: ${chainId}`);
  const enr = await callNodeFunction("getEncodedEnr");
  logger.info(`🧋 Aztec enr: ${enr}`);
  const contractAddresses = await callNodeFunction("getL1ContractAddresses");
  logger.info(
    `🧋 Aztec contract addresses: ${JSON.stringify(contractAddresses)}`
  );
  const protocolContractAddresses = await callNodeFunction(
    "getProtocolContractAddresses"
  );
  logger.info(
    `🧋 Aztec protocol contract addresses: ${JSON.stringify(
      protocolContractAddresses
    )}`
  );
  const nodeInfo: NodeInfo = {
    nodeVersion,
    l1ChainId: chainId,
    protocolVersion,
    enr,
    l1ContractAddresses: contractAddresses,
    protocolContractAddresses: protocolContractAddresses,
  };

  return {
    nodeInfo,
    rpcUrl: AZTEC_RPC_URL,
  };
};

export const getBlock = async (height: number) =>
  callNodeFunction("getBlock", [height]);

export const getBlocks = async (fromHeight: number, toHeight: number) => {
  if (toHeight - fromHeight > MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS)
    throw new Error("Too many blocks to fetch");
  const blocks = [];
  for (let i = fromHeight; i < toHeight; i++) {
    if (NODE_ENV === "development")
      await new Promise((r) => setTimeout(r, 500));
    else await new Promise((r) => setTimeout(r, 200));
    const block = await getBlock(i);
    blocks.push(block);
  }

  return blocks;
};

export const getLatestHeight = async () => {
  const [bn, provenBn] = await Promise.all([
    callNodeFunction("getBlockNumber"),
    callNodeFunction("getProvenBlockNumber"),
  ]);
  // TODO: if provenBn is constantly behind, we should start storing and displaying it in the UI
  if (bn - provenBn > 0) {
    logger.warn(
      `🃏 Difference between block and proven block: ${bn - provenBn}`
    );
  }
  return bn;
};

export const getPendingTxs = async () => callNodeFunction("getPendingTxs");
