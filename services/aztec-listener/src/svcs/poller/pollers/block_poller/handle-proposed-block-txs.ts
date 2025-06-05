import { L2Block } from "@aztec/aztec.js";
import { logger } from "../../../../logger.js";
import { getTxs, storeOrUpdate } from "../../../database/txs.controller.js";

export const handleProposedTransactions = async (block: L2Block) => {
  try {
    const pendingOrDroppedTxs = await getTxs(["pending", "dropped"]);
    for (const tx of pendingOrDroppedTxs) {
      if (
        block.body.txEffects.some(
          (txEffect) => txEffect.txHash.toString() === tx.txHash,
        )
      ) {
        await storeOrUpdate(tx, "proposed");
        logger.info(`✅ Updated tx ${tx.txHash} to proposed state`);
      }
    }
  } catch (error) {
    logger.error("Error handling proposed transactions:", error);
  }
};
