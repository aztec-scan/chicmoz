import { L2Block } from "@aztec/aztec.js";
import { blockFromString, parseBlock } from "@chicmoz-pkg/backend-utils";
import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  NewBlockEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2Block,
  ChicmozL2TxEffect,
  HexString,
} from "@chicmoz-pkg/types";
import { and, eq, gt, isNull } from "drizzle-orm";
import { SERVICE_NAME } from "../../../constants.js";
import { L2_NETWORK_ID } from "../../../environment.js";
import { logger } from "../../../logger.js";
import { deleteL2BlockByHeight } from "../../../svcs/database/controllers/l2block/delete.js";
import { getBlock } from "../../../svcs/database/controllers/l2block/get-block.js";
import { ensureFinalizationStatusStored } from "../../../svcs/database/controllers/l2block/store.js";
import { controllers } from "../../../svcs/database/index.js";
import { l2Block } from "../../../svcs/database/schema/l2block/index.js";
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

  // First check if a block with the same height but different hash already exists
  const existingBlock = await getBlock(parsedBlock.height);

  if (existingBlock && existingBlock.hash !== parsedBlock.hash) {
    // This is a re-org!
    logger.warn(
      `Re-org detected at height ${parsedBlock.height}. Existing hash: ${existingBlock.hash}, new hash: ${parsedBlock.hash}`,
    );

    // Get current timestamp
    const now = new Date();

    // 1. Update the existing block's orphan timestamp and set hasOrphanedParent to false
    await markBlockAsOrphaned(existingBlock.hash, now, false);

    // 2. Update all blocks with a higher height to be orphaned with hasOrphanedParent=true
    await markHigherBlocksAsOrphaned(parsedBlock.height, now);
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

/**
 * Mark a block as orphaned
 */
const markBlockAsOrphaned = async (
  blockHash: HexString,
  timestamp: Date,
  hasOrphanedParent: boolean,
) => {
  logger.info(
    `Marking block ${blockHash} as orphaned. hasOrphanedParent: ${hasOrphanedParent}`,
  );

  await db()
    .update(l2Block)
    .set({
      orphan_timestamp: timestamp,
      orphan_hasOrphanedParent: hasOrphanedParent,
    })
    .where(eq(l2Block.hash, blockHash));
};

/**
 * Mark all blocks with height > targetHeight and orphan_timestamp === null as orphaned
 */
const markHigherBlocksAsOrphaned = async (
  targetHeight: bigint,
  timestamp: Date,
) => {
  logger.info(
    `Marking all blocks with height > ${targetHeight} as orphaned with parent`,
  );

  // Find all blocks with higher height that aren't already orphaned
  const higherBlocks = await db()
    .select({ hash: l2Block.hash })
    .from(l2Block)
    .where(
      and(gt(l2Block.height, targetHeight), isNull(l2Block.orphan_timestamp)),
    );

  // Mark them all as orphaned with hasOrphanedParent=true
  for (const block of higherBlocks) {
    await markBlockAsOrphaned(block.hash, timestamp, true);
  }
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
