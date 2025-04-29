import { L2Block } from "@aztec/aztec.js";
import { blockFromString, parseBlock } from "@chicmoz-pkg/backend-utils";
import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  NewBlockEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { ChicmozL2Block, ChicmozL2TxEffect } from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../../constants.js";
import { L2_NETWORK_ID } from "../../../environment.js";
import { logger } from "../../../logger.js";
import { deleteL2BlockByHeight } from "../../../svcs/database/controllers/l2block/delete.js";
import { ensureFinalizationStatusStored } from "../../../svcs/database/controllers/l2block/store.js";
import { controllers } from "../../../svcs/database/index.js";
import { emit } from "../../index.js";
import { handleDuplicateBlockError } from "../utils.js";
import { storeContracts } from "./contracts.js";

const truncateString = (value: string) => {
  const startHash = value.substring(0, 100);
  const endHash = value.substring(value.length - 100, value.length);
  return `${startHash}...${endHash}`;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hackyLogBlock = (b: L2Block) => {
  const blockString = JSON.stringify(b, null, 2);
  const logString = blockString
    .split(":")
    .map((v) => {
      if (v.length > 200 && v.includes(",")) {
        return truncateString(v);
      }

      return v;
    })
    .join(":");
  logger.error(`🚫 Block: ${logString}`);
  b.body.txEffects.forEach((txEffect) => {
    txEffect.privateLogs.forEach((log) => {
      log.toFields().forEach((field) => {
        logger.error(`🚫 TxEffect: ${field.toString()}`);
      });
    });
  });
};

const onBlock = async ({
  block,
  blockNumber,
  finalizationStatus,
}: NewBlockEvent) => {
  if (!block) {
    logger.error("🚫 Block is empty");
    return;
  }
  logger.info(`👓 Parsing block ${blockNumber}`);
  const b = blockFromString(block);
  let parsedBlock;
  try {
    parsedBlock = await parseBlock(b, finalizationStatus);
  } catch (e) {
    logger.error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Failed to parse block ${blockNumber}: ${(e as Error)?.stack ?? e}`,
    );
    return;
  }

  await storeBlock(parsedBlock);
  await storeContracts(b, parsedBlock.hash);
  await pendingTxsHook(parsedBlock.body.txEffects);
};

const storeBlock = async (parsedBlock: ChicmozL2Block, haveRetried = false) => {
  logger.info(
    `🧢 Storing block ${parsedBlock.height} (hash: ${parsedBlock.hash})`,
  );

  // For now, we'll simplify reorg detection
  // In a real implementation, we would need to properly detect if this block
  // is replacing an existing block at the same height

  // We'll assume no reorg for now, as proper reorg detection requires access to the DB
  // which we're having trouble with in the current code structure

  // TODO: Implement proper reorg detection by querying existing blocks at this height
  const reorgDetected = false;

  if (reorgDetected) {
    logger.info(
      `Detected reorg at height ${parsedBlock.height}, new block ${parsedBlock.hash}`,
    );
    // We would need the hash of the existing block to handle the reorg properly
    // await handleReorg(existingBlockHash, parsedBlock.height);
  }

  // Set orphan fields to null/false for the new block
  parsedBlock.orphan = undefined;

  // Store the new block
  const storeRes = await controllers.l2Block
    .store(parsedBlock)
    .catch(async (e) => {
      if (haveRetried) {
        throw new Error(
          `Failed to store block ${parsedBlock.height} after retry: ${e}`,
        );
      }

      // If we still get an error, we'll try the old approach as fallback
      const shouldRetry = await handleDuplicateBlockError(
        e as Error,
        `block ${parsedBlock.height}`,
        async () => {
          logger.warn(
            `Deleting block ${parsedBlock.height} (hash: ${parsedBlock.hash})`,
          );
          await deleteL2BlockByHeight(parsedBlock.height);
        },
      );

      if (shouldRetry) {
        return storeBlock(parsedBlock, true);
      } else {
        await ensureFinalizationStatusStored(
          // NOTE: this is currently assuming that the error is a duplicate error
          parsedBlock.hash,
          parsedBlock.height,
          parsedBlock.finalizationStatus,
        );
      }
    });

  await emit.l2BlockFinalizationUpdate(storeRes?.finalizationUpdate ?? null);
};

const pendingTxsHook = async (txEffects: ChicmozL2TxEffect[]) => {
  await controllers.l2Tx.replaceTxsWithTxEffects(txEffects);
};

export const blockHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "blockHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "NEW_BLOCK_EVENT"),
  cb: onBlock as (arg0: unknown) => Promise<void>,
};

export const catchupHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "catchupHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "CATCHUP_BLOCK_EVENT"),
  cb: ((event: NewBlockEvent) => {
    logger.info(`Catchup block event`);
    return onBlock(event);
  }) as (arg0: unknown) => Promise<void>,
};
