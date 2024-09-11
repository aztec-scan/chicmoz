import { L2Block } from "@aztec/aztec.js";
import { logger } from "../logger.js";
import { publishMessage } from "../message-bus/index.js";

export const onBlock = async (block: L2Block) => {
  const height = Number(block.header.globalVariables.blockNumber);
  logger.info(`🦊 publishing block ${height}...`);
  const blockStr = block.toString();
  await publishMessage("NEW_BLOCK_EVENT", { block: blockStr });
};

// TODO: onCatchupAztecBlocks
// TODO: onCatchupRequestFromExplorerApi
