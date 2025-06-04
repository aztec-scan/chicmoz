import { AztecAddress, L2Block } from "@aztec/aztec.js";
import { logger } from "../../../../logger.js";
import {
  deletePendingTx,
  getAllPendingTxs,
} from "../../../database/pending-txs.controller.js";
import { publishMessage } from "../../../message-bus/index.js";
import { getBalanceOf } from "../../network-client/index.js";

export const handleProvenTransactions = async (block: L2Block) => {
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
      provenTxHashes.includes(pendingTx.txHash),
    );

    if (provenPendingTxs.length === 0) {
      return;
    }

    const blockNumber = Number(block.header.globalVariables.blockNumber);
    logger.info(
      `🎯 Found ${provenPendingTxs.length} proven pending txs in block ${blockNumber}`,
    );

    // For each proven pending tx, query balance and publish event
    for (const provenTx of provenPendingTxs) {
      try {
        // Convert feePayer string to AztecAddress
        const feePayerAddress = AztecAddress.fromString(provenTx.feePayer);

        // Query balance of feePayer
        const balance = await getBalanceOf(blockNumber, feePayerAddress);

        // Publish contractInstanceBalance event
        await publishMessage("CONTRACT_INSTANCE_BALANCE_EVENT", {
          contractAddress: provenTx.feePayer,
          balance: balance.toString(),
          timestamp: new Date(),
        });

        // Remove pending tx from DB
        await deletePendingTx(provenTx.txHash);

        logger.info(
          `✅ Processed proven tx ${provenTx.txHash}, balance: ${balance.toString()}`,
        );
      } catch (error) {
        logger.error(`Error processing proven tx ${provenTx.txHash}:`, error);
      }
    }
  } catch (error) {
    logger.error("Error handling proven transactions:", error);
  }
};
