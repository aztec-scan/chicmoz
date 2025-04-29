import { HexString } from "@chicmoz-pkg/types";
import { logger } from "../../../logger.js";
import { handleReorgOrphaning } from "../../../svcs/database/controllers/l2block/orphan.js";

/**
 * Handles a reorg event by orphaning the replaced blocks and storing their
 * transaction effects as dropped transactions.
 *
 * @param originalBlockHash The hash of the block being replaced
 * @param targetHeight The height at which the reorg occurred
 * @returns The number of blocks that were orphaned
 */
export const handleReorg = async (
  originalBlockHash: HexString,
  targetHeight: bigint,
): Promise<number> => {
  try {
    logger.info(
      `🔄 Handling reorg at height ${targetHeight}. Original block: ${originalBlockHash}`,
    );

    // Use the orphaning handler to mark blocks as orphaned and store tx effects as dropped
    const orphanedCount = await handleReorgOrphaning(
      originalBlockHash,
      targetHeight,
    );

    logger.info(
      `🔄 Reorg processing complete. Orphaned ${orphanedCount} blocks.`,
    );
    return orphanedCount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error handling reorg: ${errorMessage}`);
    logger.error(
      error instanceof Error ? error.stack : "No stack trace available",
    );
    throw error;
  }
};

/**
 * If this file is imported from an event handler, you'd likely have something like:
 */
/*
export const reorgEventHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "reorgEventHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "BLOCK_REORG_EVENT"),
  cb: async ({ originalBlockHash, targetHeight }: BlockReorgEvent) => {
    await handleReorg(originalBlockHash, targetHeight);
  },
};
*/
