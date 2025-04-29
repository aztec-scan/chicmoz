import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2DroppedTxPreviousState,
  ChicmozL2DroppedTxReason,
  HexString,
} from "@chicmoz-pkg/types";
import { and, eq, gt, isNull } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import {
  body,
  l2Block,
  txEffect,
} from "../../../database/schema/l2block/index.js";
import { storeDroppedTx } from "../../controllers/dropped-tx/store.js";

/**
 * Mark a block as orphaned with the specified parent status
 */
export const markBlockAsOrphaned = async (
  blockHash: HexString,
  timestamp: Date,
  hasOrphanedParent: boolean,
): Promise<void> => {
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
 * @returns The number of blocks that were marked as orphaned
 */
export const markHigherBlocksAsOrphaned = async (
  targetHeight: bigint,
  timestamp: Date,
): Promise<number> => {
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

  const orphanedCount = higherBlocks.length;

  // Mark them all as orphaned with hasOrphanedParent=true
  for (const block of higherBlocks) {
    await markBlockAsOrphaned(block.hash, timestamp, true);
  }

  logger.info(`Marked ${orphanedCount} child blocks as orphaned`);
  return orphanedCount;
};

/**
 * Handle a re-org by marking the specified block and all higher blocks as orphaned
 * Uses a transaction to ensure all operations are atomic
 *
 * @param originalBlockHash The hash of the block being replaced (original block at the height)
 * @param targetHeight The height at which the re-org occurred
 * @returns The number of total blocks orphaned (including the original)
 */
export const handleReorgOrphaning = async (
  originalBlockHash: HexString,
  targetHeight: bigint,
): Promise<number> => {
  const now = new Date();

  return await db().transaction(async (dbTx) => {
    logger.info(
      `Starting orphan transaction for re-org at height ${targetHeight}`,
    );

    // 1. Mark the original block as orphaned (root of orphaned chain)
    await dbTx
      .update(l2Block)
      .set({
        orphan_timestamp: now,
        orphan_hasOrphanedParent: false,
      })
      .where(eq(l2Block.hash, originalBlockHash));

    // Find transaction effects in the orphaned block and store them as dropped
    await storeOrphanedTxEffectsAsDropped(dbTx, originalBlockHash, now);

    // 2. Find and mark all higher blocks as orphaned with parent
    const higherBlocks = await dbTx
      .select({ hash: l2Block.hash })
      .from(l2Block)
      .where(
        and(gt(l2Block.height, targetHeight), isNull(l2Block.orphan_timestamp)),
      );

    const orphanedChildrenCount = higherBlocks.length;

    // Mark all children as orphaned with parent=true
    for (const block of higherBlocks) {
      await dbTx
        .update(l2Block)
        .set({
          orphan_timestamp: now,
          orphan_hasOrphanedParent: true,
        })
        .where(eq(l2Block.hash, block.hash));

      // Store transaction effects from this block as dropped
      await storeOrphanedTxEffectsAsDropped(dbTx, block.hash, now);
    }

    const totalOrphaned = orphanedChildrenCount + 1; // +1 for the original block
    logger.info(
      `Completed orphan transaction. Total orphaned: ${totalOrphaned} (1 root + ${orphanedChildrenCount} children)`,
    );

    return totalOrphaned;
  });
};

/**
 * Find transaction effects in an orphaned block and store them as dropped transactions
 */
const storeOrphanedTxEffectsAsDropped = async (
  dbTx: ReturnType<typeof db>,
  blockHash: HexString,
  timestamp: Date,
): Promise<void> => {
  // Find the body ID for this block
  const blockBody = await dbTx
    .select({ id: body.id })
    .from(body)
    .where(eq(body.blockHash, blockHash))
    .limit(1);

  if (blockBody.length === 0) {
    logger.warn(`No body found for orphaned block ${blockHash}`);
    return;
  }

  const bodyId = blockBody[0].id;

  // Find all transaction effects in this body
  const txEffects = await dbTx
    .select({
      txHash: txEffect.txHash,
      txBirthTimestamp: txEffect.txBirthTimestamp,
    })
    .from(txEffect)
    .where(eq(txEffect.bodyId, bodyId));

  if (txEffects.length === 0) {
    logger.info(`No transaction effects found in orphaned block ${blockHash}`);
    return;
  }

  logger.info(
    `Found ${txEffects.length} transaction effects to mark as dropped in block ${blockHash}`,
  );

  // Store each transaction effect as a dropped transaction
  for (const tx of txEffects) {
    try {
      await storeDroppedTx({
        txHash: tx.txHash,
        reason: ChicmozL2DroppedTxReason.REORG,
        previousState: ChicmozL2DroppedTxPreviousState.INCLUDED,
        orphanedTxEffectHash: tx.txHash,
        createdAt:
          tx.txBirthTimestamp instanceof Date
            ? tx.txBirthTimestamp.getTime()
            : undefined,
        droppedAt: timestamp.getTime(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Failed to store dropped transaction ${tx.txHash}: ${errorMessage}`,
      );
    }
  }
};
