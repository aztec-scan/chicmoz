import { blockFromBuffer, parseBlock } from "@chicmoz-pkg/backend-utils";
import { NewBlockEvent } from "@chicmoz-pkg/message-registry";
import { logger } from "../logger.js";
import { sendBlockToClients } from "../ws-server/index.js";

export const onBlock = async ({
  block,
  blockNumber,
  finalizationStatus,
}: NewBlockEvent) => {
  if (!block) {
    logger.error("🚫 Block is empty");
    return;
  }
  logger.info(`👓 Parsing block ${blockNumber}`);
  let parsedBlock;
  try {
    const b = blockFromBuffer(block);
    parsedBlock = await parseBlock(b, finalizationStatus);
  } catch (e) {
    logger.error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Failed to parse block ${blockNumber}: ${e}`,
    );
    return;
  }
  sendBlockToClients(parsedBlock);
};
