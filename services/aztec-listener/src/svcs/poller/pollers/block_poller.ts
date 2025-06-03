import { AztecAddress, L2Block } from "@aztec/aztec.js";
import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";
import { ContractInstanceBalanceEvent } from "@chicmoz-pkg/message-registry";
import {
  AZTEC_DISABLE_LISTEN_FOR_PROPOSED_BLOCKS,
  AZTEC_DISABLE_LISTEN_FOR_PROVEN_BLOCKS,
  BLOCK_POLL_INTERVAL_MS,
  CATCHUP_POLL_WAIT_TIME_MS,
} from "../../../environment.js";
import { onBlock, onCatchupBlock } from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";
import { publishMessage } from "../../message-bus/index.js";
import {
  getAllPendingTxs,
  deletePendingTx,
} from "../../database/pending-txs.controller.js";
import {
  getBlockHeights,
  storeBlockHeights,
  storeProcessedProposedBlockHeight,
  storeProcessedProvenBlockHeight,
} from "../../database/heights.controller.js";
import {
  getBlock,
  getBalanceOf,
  getLatestProposedHeight,
  getLatestProvenHeight,
} from "../network-client/index.js";

let timeoutId: number | undefined;
let cancelPolling = false;

export const startPolling = async ({
  forceStartFromProposedHeight,
  forceStartFromProvenHeight,
}: {
  forceStartFromProposedHeight?: number;
  forceStartFromProvenHeight?: number;
} = {}) => {
  if (timeoutId) {
    throw new Error("Poller already started");
  }
  if (forceStartFromProposedHeight) {
    await storeProcessedProposedBlockHeight(forceStartFromProposedHeight - 1);
  }
  if (forceStartFromProvenHeight) {
    await storeProcessedProvenBlockHeight(forceStartFromProvenHeight - 1);
  }
  syncRecursivePolling(true);
};

export const stopPolling = () => {
  cancelPolling = true;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
};

const syncRecursivePolling = (isFirstRun: boolean) => {
  recursivePolling(isFirstRun).catch((e) => {
    logger.error(`🐻 error in recursive polling: ${(e as Error).stack}`);
  });
};

const recursivePolling = async (isFirstRun = false) => {
  try {
    const [chainProposedBlockHeight, chainProvenBlockHeight] =
      await Promise.all([getLatestProposedHeight(), getLatestProvenHeight()]);
    let heights = {
      ...(await getBlockHeights()),
      chainProposedBlockHeight,
      chainProvenBlockHeight,
    };

    heights = await ensureSaneValues(heights);
    const proposedProvenDiff =
      heights.chainProposedBlockHeight - heights.chainProvenBlockHeight;
    const proposedHeightDiff =
      heights.chainProposedBlockHeight - heights.processedProposedBlockHeight;
    const provenHeightDiff =
      heights.chainProvenBlockHeight - heights.processedProvenBlockHeight;
    logger.info(`🐱 ==== poller state ==== 🐱 ${
      proposedProvenDiff > 0
        ? `| ${proposedProvenDiff} proposed blocks ahead of proven`
        : ""
    }
Proposed height PROCESSED ${heights.processedProposedBlockHeight} | CHAIN ${
      heights.chainProposedBlockHeight
    } | DIFF ${proposedHeightDiff}
Proven height   PROCESSED ${heights.processedProvenBlockHeight} | CHAIN ${
      heights.chainProvenBlockHeight
    } | DIFF ${provenHeightDiff}`);
    try {
      while (
        !cancelPolling &&
        heights.processedProposedBlockHeight < chainProposedBlockHeight &&
        !AZTEC_DISABLE_LISTEN_FOR_PROPOSED_BLOCKS
      ) {
        heights.processedProposedBlockHeight++;
        await pollProposedBlock(
          heights.processedProposedBlockHeight,
          isFirstRun,
        );
      }
    } catch (e) {
      logger.error(
        `🐼 error while processing proposed blocks: ${(e as Error).stack}`,
      );
    }
    try {
      while (
        !cancelPolling &&
        heights.processedProvenBlockHeight < chainProvenBlockHeight &&
        !AZTEC_DISABLE_LISTEN_FOR_PROVEN_BLOCKS
      ) {
        heights.processedProvenBlockHeight++;
        await pollProvenBlock(heights.processedProvenBlockHeight, isFirstRun);
      }
    } catch (e) {
      logger.error(
        `🐹 error while processing proven blocks: ${(e as Error).stack}`,
      );
    }
    const nothingToProcess = proposedHeightDiff === 0 && provenHeightDiff === 0;
    if (nothingToProcess) {
      await oneEternalCatchupFetch(chainProposedBlockHeight);
    }
  } catch (e) {
    logger.error(`🐱 error while processing blocks: ${(e as Error).stack}`);
  } finally {
    logger.info(
      `🐱 waiting ${BLOCK_POLL_INTERVAL_MS / 1000}s for next poll...`,
    );
    timeoutId = setTimeout(syncRecursivePolling, BLOCK_POLL_INTERVAL_MS);
  }
};

const pollProposedBlock = async (height: number, isCatchup: boolean) => {
  const block = await internalGetBlock(height);
  if (isCatchup) {
    await onCatchupBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
    );
    logger.info(`🐱 catchup proposed block ${height}`);
    await new Promise((r) => setTimeout(r, CATCHUP_POLL_WAIT_TIME_MS));
  } else {
    await onBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
    );
  }
  await storeProcessedProposedBlockHeight(height);
};

const pollProvenBlock = async (height: number, isCatchup: boolean) => {
  const block = await internalGetBlock(height);
  
  // Handle proven transactions
  await handleProvenTransactions(block);
  
  if (isCatchup) {
    await onCatchupBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN,
    );
    logger.info(`🐱 catchup proven block ${height}`);
    await new Promise((r) => setTimeout(r, CATCHUP_POLL_WAIT_TIME_MS));
  } else {
    await onBlock(block, ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN);
  }
  await storeProcessedProvenBlockHeight(height);
};

const handleProvenTransactions = async (block: L2Block) => {
  try {
    // Get all pending txs from DB
    const pendingTxs = await getAllPendingTxs();
    if (pendingTxs.length === 0) {
      return;
    }

    // Get transaction hashes from the proven block
    const provenTxHashes = block.body.txEffects.map((txEffect) => {
      const hash = txEffect.txHash;
      return hash.toString();
    });

    // Find pending txs that are now proven
    const provenPendingTxs = pendingTxs.filter((pendingTx) =>
      provenTxHashes.includes(pendingTx.txHash)
    );

    if (provenPendingTxs.length === 0) {
      return;
    }

    const blockNumber = Number(block.header.globalVariables.blockNumber);
    logger.info(`🎯 Found ${provenPendingTxs.length} proven pending txs in block ${blockNumber}`);

    // For each proven pending tx, query balance and publish event
    for (const provenTx of provenPendingTxs) {
      try {
        // Convert feePayer string to AztecAddress
        const feePayerAddress = AztecAddress.fromString(provenTx.feePayer);
        
        // Query balance of feePayer
        const balance = await getBalanceOf("latest", feePayerAddress);
        
        // Publish contractInstanceBalance event
        await publishMessage("CONTRACT_INSTANCE_BALANCE_EVENT", {
          contractAddress: provenTx.feePayer,
          balance: balance.toString(),
          timestamp: Date.now(),
        } as ContractInstanceBalanceEvent);

        // Remove pending tx from DB
        await deletePendingTx(provenTx.txHash);

        logger.info(`✅ Processed proven tx ${provenTx.txHash}, balance: ${balance.toString()}`);
      } catch (error) {
        logger.error(`Error processing proven tx ${provenTx.txHash}:`, error);
      }
    }
  } catch (error) {
    logger.error("Error handling proven transactions:", error);
  }
};

const internalGetBlock = async (height: number) => {
  const blockRes = await getBlock(height);
  if (!blockRes) {
    throw new Error(`Block ${height} not found`);
  }
  return blockRes;
};

const ensureSaneValues = async (
  heights: Awaited<ReturnType<typeof getBlockHeights>>,
) => {
  if (heights.processedProvenBlockHeight > heights.chainProvenBlockHeight) {
    logger.warn(
      `🐷 processed proven block height is higher than chain proven height: ${heights.processedProvenBlockHeight} > ${heights.chainProvenBlockHeight}. This might be L1 reorg. Backing up DB-value to match chain proven height.`,
    );
    heights.processedProvenBlockHeight = heights.chainProvenBlockHeight;
  }
  if (heights.processedProposedBlockHeight > heights.chainProposedBlockHeight) {
    logger.warn(
      `🐷 processed proposed block height is higher than chain proposed height: ${heights.processedProvenBlockHeight} > ${heights.chainProvenBlockHeight}. This might be L2 (or even L1?) reorg. Backing up DB-value to match chain proposed height.`,
    );
    heights.processedProposedBlockHeight = heights.chainProposedBlockHeight;
  }
  if (heights.processedProposedBlockHeight < heights.chainProvenBlockHeight) {
    logger.debug(
      `🐷 processed proposed block height is lower than chain proven height: ${heights.processedProvenBlockHeight} < ${heights.chainProvenBlockHeight}. Adjusting DB-value so that block is not fetched twice.`,
    );
    heights.processedProposedBlockHeight = heights.chainProvenBlockHeight;
  }
  await storeBlockHeights(heights);
  return heights;
};

let currentEternalCatchupHeight = 1;
const oneEternalCatchupFetch = async (currentProposedHeight: number) => {
  // NOTE: if we have started the poller without catchup, we at least want it to eventually be in sync
  const block = await internalGetBlock(currentEternalCatchupHeight);
  if (block) {
    await onCatchupBlock(
      block,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
    );
    currentEternalCatchupHeight =
      (currentEternalCatchupHeight + 1) % currentProposedHeight || 1;
    currentEternalCatchupHeight = Math.min(
      currentEternalCatchupHeight,
      currentProposedHeight,
    );
  }
};
