import { blockFromString, parseBlock } from "@chicmoz-pkg/backend-utils";
import { NewBlockEvent } from "@chicmoz-pkg/message-registry";
import { ChicmozL2Block, ChicmozL2TxEffect } from "@chicmoz-pkg/types";
import { controllers } from "../../database/index.js";
import { logger } from "../../logger.js";
import { storeContracts } from "./contracts.js";
import { handleDuplicateBlockError } from "../utils.js";

export const onBlock = async ({ block, blockNumber }: NewBlockEvent) => {
  // TODO: start storing NODE_INFO connected to the block
  if (!block) {
    logger.error("🚫 Block is empty");
    return;
  }
  logger.info(`👓 Parsing block ${blockNumber}`);
  const b = blockFromString(block);
  let parsedBlock;
  try {
    parsedBlock = parseBlock(b);
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

const storeBlock = async (parsedBlock: ChicmozL2Block) => {
  logger.info(
    `🧢 Storing block ${parsedBlock.height} (hash: ${parsedBlock.hash})`,
  );
  await controllers.l2Block.store(parsedBlock).catch(async (e) => {
    const isNewChain = await handleDuplicateBlockError(
      e as Error,
      `block ${parsedBlock.height}`
    );
    if (isNewChain) return storeBlock(parsedBlock);
  });
};

const pendingTxsHook = async (txEffects: ChicmozL2TxEffect[]) => {
  await controllers.l2Tx.replaceTxsWithTxEffects(txEffects);
};
