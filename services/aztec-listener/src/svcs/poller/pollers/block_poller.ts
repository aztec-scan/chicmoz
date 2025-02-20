import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";
import {
  AZTEC_LISTEN_FOR_PROPOSED_BLOCKS,
  AZTEC_LISTEN_FOR_PROVEN_BLOCKS,
  BLOCK_POLL_INTERVAL_MS,
} from "../../../environment.js";
import { onBlock, onCatchupBlock } from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";
import {
  getBlockHeights,
  storeBlockHeights,
  storeProcessedProposedBlockHeight,
  storeProcessedProvenBlockHeight,
} from "../../database/heights.controller.js";
import {
  getBlock,
  getLatestProposedHeight,
  getLatestProvenHeight,
} from "../network-client/index.js";

let timoutId: number | undefined;
let cancelPolling = false;

export const startPolling = async ({
  forceStartFromProposedHeight,
  forceStartFromProvenHeight,
}: {
  forceStartFromProposedHeight?: number;
  forceStartFromProvenHeight?: number;
} = {}) => {
  if (timoutId) throw new Error("Poller already started");
  if (forceStartFromProposedHeight)
    await storeProcessedProposedBlockHeight(forceStartFromProposedHeight);
  if (forceStartFromProvenHeight)
    await storeProcessedProvenBlockHeight(forceStartFromProvenHeight);
  syncRecursivePolling(true);
};

export const stopPolling = () => {
  cancelPolling = true;
  if (timoutId) {
    clearTimeout(timoutId);
    timoutId = undefined;
  }
};

const syncRecursivePolling = (isFirstRun: boolean) => {
  recursivePolling(isFirstRun).catch((e) => {
    logger.error(`🐻 error in recursive polling: ${(e as Error).stack}`);
  });
};

const recursivePolling = async (isFirstRun = false) => {
  const [chainProposedHeight, chainProvenHeight] = await Promise.all([
    getLatestProposedHeight(),
    getLatestProvenHeight(),
  ]);
  const heights = {
    ...(await getBlockHeights()),
    chainProvenHeight,
    chainProposedHeight,
  };

  await ensureSaneValues(heights);
  logger.info(`🐱 heights:
Processed proposed height: ${heights.processedProposedBlockHeight}
Chain proposed height: ${heights.chainProposedBlockHeight}
  Diff: ${
    heights.chainProposedBlockHeight - heights.processedProposedBlockHeight
  }
Processed proven height: ${heights.processedProvenBlockHeight}
Chain proven height: ${heights.chainProvenBlockHeight}
  Diff: ${
    heights.chainProvenBlockHeight - heights.processedProvenBlockHeight
  }`);
  try {
    while (
      !cancelPolling &&
      heights.processedProposedBlockHeight < chainProposedHeight &&
      AZTEC_LISTEN_FOR_PROPOSED_BLOCKS
    ) {
      heights.processedProposedBlockHeight++;
      await pollProposedBlock(heights.processedProposedBlockHeight, isFirstRun);
    }
  } catch (e) {
    logger.error(
      `🐼 error while processing proposed blocks: ${(e as Error).stack}`
    );
  }
  try {
    while (
      !cancelPolling &&
      heights.processedProvenBlockHeight < chainProvenHeight &&
      AZTEC_LISTEN_FOR_PROVEN_BLOCKS
    ) {
      heights.processedProvenBlockHeight++;
      await pollProvenBlock(heights.processedProvenBlockHeight, isFirstRun);
    }
  } catch (e) {
    logger.error(
      `🐹 error while processing proven blocks: ${(e as Error).stack}`
    );
  }

  logger.info(`🐱 waiting ${BLOCK_POLL_INTERVAL_MS / 1000}s for next poll...`);
  timoutId = setTimeout(syncRecursivePolling, BLOCK_POLL_INTERVAL_MS);
};

const pollProposedBlock = async (height: number, isCatchup: boolean) => {
  const block = await internalGetBlock(height);
  if (isCatchup) {
    await onCatchupBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED
    );
  } else {
    await onBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED
    );
  }
  await storeProcessedProposedBlockHeight(height);
};

const pollProvenBlock = async (height: number, isCatchup: boolean) => {
  const block = await internalGetBlock(height);
  if (isCatchup) {
    await onCatchupBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN
    );
  } else {
    await onBlock(block, ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN);
  }
  await storeProcessedProvenBlockHeight(height);
};

const internalGetBlock = async (height: number) => {
  const blockRes = await getBlock(height);
  if (!blockRes) throw new Error(`Block ${height} not found`);
  return blockRes;
};

const ensureSaneValues = async (
  heights: Awaited<ReturnType<typeof getBlockHeights>>
) => {
  if (heights.processedProvenBlockHeight > heights.chainProvenBlockHeight) {
    logger.warn(
      `🐱🐷 processed proven block height is higher than chain proven height: ${heights.processedProvenBlockHeight} > ${heights.chainProvenBlockHeight}. This might be L1 reorg. Backing up DB-value to match chain proven height.`
    );
    heights.processedProvenBlockHeight = heights.chainProvenBlockHeight;
  }
  if (heights.processedProposedBlockHeight > heights.chainProposedBlockHeight) {
    logger.warn(
      `🐱🐷 processed proposed block height is higher than chain proposed height: ${heights.processedProvenBlockHeight} > ${heights.chainProvenBlockHeight}. This might be L1 (or even L2?) reorg. Backing up DB-value to match chain proposed height.`
    );
    heights.processedProposedBlockHeight = heights.chainProposedBlockHeight;
  }
  if (heights.processedProposedBlockHeight < heights.chainProvenBlockHeight) {
    logger.debug(
      `🐱🐷 processed proposed block height is lower than chain proven height: ${heights.processedProvenBlockHeight} < ${heights.chainProvenBlockHeight}. Adjusting DB-value so that block is not fetched twice.`
    );
    heights.processedProposedBlockHeight = heights.chainProvenBlockHeight;
  }
  await storeBlockHeights(heights);
};
