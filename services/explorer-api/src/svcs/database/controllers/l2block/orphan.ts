import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString } from "@chicmoz-pkg/types";
import { and, eq, gt, isNull } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { l2Block } from "../../../database/schema/l2block/index.js";

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
    }

    const totalOrphaned = orphanedChildrenCount + 1; // +1 for the original block
    logger.info(
      `Completed orphan transaction. Total orphaned: ${totalOrphaned} (1 root + ${orphanedChildrenCount} children)`,
    );

    return totalOrphaned;
  });
};
