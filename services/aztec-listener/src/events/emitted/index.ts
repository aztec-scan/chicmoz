import { L2Block } from "@aztec/aztec.js";
import {
  ChicmozChainInfo,
  ChicmozL2BlockFinalizationStatus,
  ChicmozL2RpcNodeError,
  ChicmozL2Sequencer,
  chicmozL2RpcNodeErrorSchema,
} from "@chicmoz-pkg/types";
import { AZTEC_RPC_URL } from "../../environment.js";
import { logger } from "../../logger.js";
import {
  publishMessage,
  publishMessageSync,
} from "../../svcs/message-bus/index.js";
import { onL2RpcNodeAlive } from "./on-node-alive.js";

export const onBlock = async (
  block: L2Block,
  finalizationStatus: ChicmozL2BlockFinalizationStatus,
) => {
  const height = Number(block.header.globalVariables.blockNumber);
  const finalizationStatusStr =
    ChicmozL2BlockFinalizationStatus[finalizationStatus];
  logger.info(
    `🦊 publishing (${finalizationStatusStr}) block ${height} (hash: ${(
      await block.hash()
    ).toString()})...`,
  );
  const blockStr = block.toString();
  await publishMessage("NEW_BLOCK_EVENT", {
    block: blockStr,
    finalizationStatus,
    blockNumber: height,
  });
};

export const onCatchupBlock = async (
  block: L2Block,
  finalizationStatus: ChicmozL2BlockFinalizationStatus,
) => {
  const blockStr = block.toString();
  await publishMessage("CATCHUP_BLOCK_EVENT", {
    block: blockStr,
    finalizationStatus,
    blockNumber: Number(block.header.globalVariables.blockNumber),
  });
};
// TODO: onCatchupRequestFromExplorerApi



export const onChainInfo = async (chainInfo: ChicmozChainInfo) => {
  const event = { chainInfo };
  logger.info(`🔗 publishing CHAIN_INFO_EVENT...`);
  await publishMessage("CHAIN_INFO_EVENT", event);
};

export const onL2SequencerInfo = async (sequencer: ChicmozL2Sequencer) => {
  const event = { sequencer };
  logger.info(`🔍 publishing SEQUENCER_INFO_EVENT...`);
  await publishMessage("SEQUENCER_INFO_EVENT", event);
};

const IP_ADDRESS = AZTEC_RPC_URL.split("//")[1].split(":")[0];
const replaceIpAddress = (str: string) =>
  str.replaceAll(IP_ADDRESS, "xxx.xxx.xxx.xxx");

export const onL2RpcNodeError = (
  rpcNodeError: Omit<
    ChicmozL2RpcNodeError,
    "rpcUrl" | "count" | "createdAt" | "lastSeenAt"
  >,
) => {
  let event;
  try {
    event = {
      nodeError: chicmozL2RpcNodeErrorSchema.parse({
        ...rpcNodeError,
        rpcUrl: AZTEC_RPC_URL,
        count: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      }),
    };
  } catch (e) {
    logger.warn(`❌ onL2RpcNodeError on parse error: ${(e as Error).message}`);
    return;
  }
  logger.info(`❌ publishing L2_RPC_NODE_ERROR_EVENT...`);
  event.nodeError.cause = replaceIpAddress(event.nodeError.cause);
  event.nodeError.stack = replaceIpAddress(event.nodeError.stack);
  event.nodeError.message = replaceIpAddress(event.nodeError.message);
  publishMessageSync("L2_RPC_NODE_ERROR_EVENT", event);
};

export { onL2RpcNodeAlive };
