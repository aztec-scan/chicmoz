import {
  ChicmozChainInfo,
  ChicmozL2BlockFinalizationStatus,
  ChicmozL2RpcNodeError,
  ChicmozL2Sequencer,
  chicmozL2RpcNodeErrorSchema,
  jsonStringify,
} from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import { txsController } from "../../svcs/database/index.js";
import {
  publishMessage,
  publishMessageSync,
} from "../../svcs/message-bus/index.js";
import { onL2RpcNodeAlive } from "./on-node-alive.js";
import { L2Block } from "@aztec/stdlib/block";

export const onBlock = async (
  block: L2Block,
  finalizationStatus: ChicmozL2BlockFinalizationStatus,
) => {
  const height = Number(block.header.globalVariables.blockNumber);
  const finalizationStatusStr =
    finalizationStatus ===
    ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED
      ? `🦊 publishing (${ChicmozL2BlockFinalizationStatus[finalizationStatus]})`
      : `🐴 publishing (${ChicmozL2BlockFinalizationStatus[finalizationStatus]})`;
  logger.info(
    `${finalizationStatusStr} block ${height} (hash: ${(
      await block.hash()
    ).toString()})...`,
  );
  const blockStr = block.toString();
  await publishMessage("NEW_BLOCK_EVENT", {
    block: blockStr,
    finalizationStatus,
    blockNumber: height,
  });
  const potentiallyIncludedTxs = await txsController.getTxs([
    "pending",
    "suspected_dropped",
  ]);
  const blockTxHashes = block.body.txEffects.map((effect) =>
    effect.txHash.toString(),
  );

  for (const potentialTx of potentiallyIncludedTxs) {
    const txFoundInBlock = blockTxHashes.includes(potentialTx.txHash);
    if (txFoundInBlock) {
      const newState =
        finalizationStatus ===
        ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED
          ? "proposed"
          : "proven";
      await txsController.storeOrUpdate(potentialTx, newState);
      logger.info(
        `✅ Transaction ${potentialTx.txHash} found in block ${height}, updated to ${newState}`,
      );
    }
  }
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
  logger.info(`🔗 publishing CHAIN_INFO_EVENT ${jsonStringify(event)}`);
  await publishMessage("CHAIN_INFO_EVENT", event);
};

export const onL2SequencerInfo = async (sequencer: ChicmozL2Sequencer) => {
  const event = { sequencer };
  logger.info(`🔍 publishing SEQUENCER_INFO_EVENT ${jsonStringify(event)}`);
  await publishMessage("SEQUENCER_INFO_EVENT", event);
};

const isIpAddress = (str: string) => {
  // Check if string is a valid IPv4 address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(str)) {
    const parts = str.split(".");
    return parts.every((part) => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
};

export const replaceIpAddress = (url: string) => {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided");
  }

  try {
    const host = url.split("//")[1].split(":")[0];

    if (isIpAddress(host)) {
      return "xxx.xxx.xxx.xxx"; // Hide IP address
    }

    // If it's a domain, extract just the domain name (remove subdomains)
    const domainParts = host.split(".");
    if (domainParts.length >= 2) {
      // Return the last two parts (domain.tld)
      return domainParts.slice(-2).join(".");
    }

    return host; // Return as-is if can't parse
  } catch (error) {
    return url;
  }
};
export const onL2RpcNodeError = (
  rpcNodeError: Omit<
    ChicmozL2RpcNodeError,
    "rpcUrl" | "count" | "createdAt" | "lastSeenAt"
  >,
  rpcUrl?: string,
) => {
  let event;
  try {
    event = {
      nodeError: chicmozL2RpcNodeErrorSchema.parse({
        ...rpcNodeError,
        rpcUrl: rpcUrl,
        count: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      }),
    };
  } catch (e) {
    logger.warn(`❌ onL2RpcNodeError on parse error: ${(e as Error).message}`);
    return;
  }
  logger.info(
    `❌ publishing L2_RPC_NODE_ERROR_EVENT ${rpcNodeError.nodeName ? `(${rpcNodeError.nodeName})` : ""}...`,
  );
  event.nodeError.cause = replaceIpAddress(event.nodeError.cause);
  event.nodeError.stack = replaceIpAddress(event.nodeError.stack);
  event.nodeError.message = replaceIpAddress(event.nodeError.message);
  publishMessageSync("L2_RPC_NODE_ERROR_EVENT", event);
};

export { onL2RpcNodeAlive };
