import { L2Block } from "@aztec/aztec.js/block";
import { logger } from "../../../../logger.js";
import { txsController } from "../../../database/index.js";

export const handleProposedTransactions = async (block: L2Block) => {
  try {
    const pendingOrDroppedTxs = await txsController.getTxs([
      "pending",
      "dropped",
    ]);
    for (const tx of pendingOrDroppedTxs) {
      if (
        block.body.txEffects.some(
          (txEffect) => txEffect.txHash.toString() === tx.txHash,
        )
      ) {
        await txsController.storeOrUpdate(tx, "proposed");
        logger.info(`✅ Updated tx ${tx.txHash} to proposed state`);
      }
    }
  } catch (error) {
    logger.error("Error handling proposed transactions:", error);
  }
};
