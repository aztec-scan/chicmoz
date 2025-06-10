import { AztecAddress, L2Block } from "@aztec/aztec.js";
import { logger } from "../../../../logger.js";
import { txsController } from "../../../database/index.js";
import { publishMessage } from "../../../message-bus/index.js";
import { getBalanceOf } from "../../network-client/index.js";

export const handleProvenTransactions = async (block: L2Block) => {
  try {
    const notProvenTxs = await txsController.getTxs([
      "pending",
      "dropped",
      "proposed",
    ]);
    if (notProvenTxs.length === 0) {
      return;
    }

    const provenTxHashes = block.body.txEffects.map((txEffect) => {
      const hash = txEffect.txHash;
      return hash.toString();
    });

    const provenPendingTxs = provenTxHashes
      .map((txHash) => {
        const tx = notProvenTxs.find((tx) => tx.txHash === txHash);
        if (!tx) {
          return undefined;
        }
        logger.info(`🔍 ${txHash} found in pending or dropped txs`);
        return tx;
      })
      .filter((tx) => tx !== undefined);

    if (provenPendingTxs.length === 0) {
      return;
    }

    const blockNumber = Number(block.header.globalVariables.blockNumber);
    logger.info(
      `🎯 Found ${provenPendingTxs.length} proven pending txs in block ${blockNumber}`,
    );

    for (const provenTx of provenPendingTxs) {
      try {
        const feePayerAddress = AztecAddress.fromString(provenTx.feePayer);

        const balance = await getBalanceOf(blockNumber, feePayerAddress);

        await publishMessage("CONTRACT_INSTANCE_BALANCE_EVENT", {
          contractAddress: provenTx.feePayer,
          balance: balance.toBigInt().toString(),
          timestamp: new Date(),
        });

        await txsController.deleteTx(provenTx.txHash);
      } catch (error) {
        logger.error(`Error processing proven tx ${provenTx.txHash}:`, error);
      }
    }
  } catch (error) {
    logger.error("Error handling proven transactions:", error);
  }
};
