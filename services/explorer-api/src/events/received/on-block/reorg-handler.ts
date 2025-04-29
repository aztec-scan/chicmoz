import {
  ChicmozL2Block,
  ChicmozL2DroppedTxPreviousState,
  ChicmozL2DroppedTxReason,
} from "@chicmoz-pkg/types";
import { logger } from "../../../logger.js";
import { storeDroppedTx } from "../../../svcs/database/controllers/dropped-tx/index.js";
import { getTxEffectsFromOrphanedBlocks } from "../../../svcs/database/controllers/l2TxEffect/index.js";
import { getBlock } from "../../../svcs/database/controllers/l2block/get-block.js";
import { handleReorgOrphaning } from "../../../svcs/database/controllers/l2block/orphan.js";

/**
 * Detects if there's a re-org at the given block height
 */
export const detectReorg = async (
  parsedBlock: ChicmozL2Block,
): Promise<boolean> => {
  // Check if a block with the same height but different hash already exists
  const existingBlock = await getBlock(parsedBlock.height);
  return !!(existingBlock && existingBlock.hash !== parsedBlock.hash);
};

/**
 * Handles a re-org by marking the existing block and higher blocks as orphaned
 * and storing their transactions as dropped
 * @returns The number of blocks that were orphaned (including the original block)
 */
export const handleReorg = async (
  parsedBlock: ChicmozL2Block,
): Promise<void> => {
  const existingBlock = await getBlock(parsedBlock.height);

  if (!existingBlock) {
    return;
  }

  logger.warn(
    `Re-org detected at height ${parsedBlock.height}. Existing hash: ${existingBlock.hash}, new hash: ${parsedBlock.hash}`,
  );

  // Handle the orphaning in a database transaction
  const totalOrphaned = await handleReorgOrphaning(
    existingBlock.hash,
    parsedBlock.height,
  );

  // Get txEffects from orphaned blocks
  const txEffects = await getTxEffectsFromOrphanedBlocks(
    existingBlock.hash,
    parsedBlock.height,
  );

  // Store each txEffect as a dropped transaction
  let droppedCount = 0;
  for (const txEffect of txEffects) {
    await storeDroppedTx({
      txHash: txEffect.txHash,
      previousState: ChicmozL2DroppedTxPreviousState.INCLUDED,
      reason: ChicmozL2DroppedTxReason.REORG,
      orphanedTxEffectHash: txEffect.txHash,
      createdAt: new Date(txEffect.timestamp),
      droppedAt: new Date(),
    });
    droppedCount++;
  }

  logger.warn(
    `Completed re-org handling at height ${parsedBlock.height}. Total orphaned blocks: ${totalOrphaned}, Total dropped transactions: ${droppedCount}`,
  );
};
