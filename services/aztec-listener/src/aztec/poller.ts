import { L2Block } from "@aztec/aztec.js";
import {
  BLOCK_POLL_INTERVAL_MS,
  IGNORE_PROCESSED_HEIGHT,
  MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS,
} from "../constants.js";
import { logger } from "../logger.js";
// TODO: remove database
import { storeHeight } from "../database/latestProcessedHeight.controller.js";
import { getBlock, getBlocks, getLatestHeight } from "./network-client.js";
import { onBlock } from "../event-handler/index.js";

let pollInterval: NodeJS.Timeout;
let latestProcessedHeight = -1;

export const startPolling = ({ fromHeight }: { fromHeight: number }) => {
  latestProcessedHeight = fromHeight - 1;
  pollInterval = setInterval(() => {
    void fetchAndPublishLatestBlockReoccurring();
  }, BLOCK_POLL_INTERVAL_MS);
};

export const stopPolling = () => {
  if (pollInterval) clearInterval(pollInterval);
};

const storeLatestProcessedHeight = async (height: number) => {
  const isLater = height > latestProcessedHeight;
  if (isLater) {
    latestProcessedHeight = height;
    await storeHeight(height);
  }
  return isLater;
};

const internalOnBlock = async (blockRes: L2Block | undefined) => {
  if (!blockRes) 
    throw new Error("FATAL: Poller received no block.");
  
  await onBlock(blockRes);
  await storeLatestProcessedHeight(
    Number(blockRes.header.globalVariables.blockNumber)
  );
};

const fetchAndPublishLatestBlockReoccurring = async () => {
  const networkLatestHeight = await getLatestHeight();
  if (networkLatestHeight === 0)
    throw new Error("FATAL: network returned height 0");

  const alreadyProcessed = networkLatestHeight <= latestProcessedHeight;
  if (alreadyProcessed && !IGNORE_PROCESSED_HEIGHT) {
    logger.info(
      `🐻 block ${networkLatestHeight} has already been processed, skipping...`
    );
    return;
  }

  const missedBlocks = networkLatestHeight - latestProcessedHeight > 1;
  if (missedBlocks)
    await catchUpOnMissedBlocks(latestProcessedHeight + 1, networkLatestHeight);

  const blockRes = await getBlock(networkLatestHeight);
  await internalOnBlock(blockRes);
};

const catchUpOnMissedBlocks = async (start: number, end: number) => {
  if (end - start > MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS) {
    logger.error(
      `[fetchAndPublishLatestBlockReoccurring]: more than ${MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS} blocks missed, skipping catchup...`
    );
  } else {
    const startTimeMs = new Date().getTime();
    logger.info(
      `🐯 it seems we missed blocks: ${start}-${end - 1}, catching up...`
    );
    const missedBlocks = await getBlocks(start, end);

    const processBlocks = missedBlocks.map((block) => {
      if (block) return internalOnBlock(block);
    });
    await Promise.allSettled(processBlocks);

    const durationMs = new Date().getTime() - startTimeMs;
    logger.info(`🐯 missed blocks ${start}-${end} published (${durationMs}ms)`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};
