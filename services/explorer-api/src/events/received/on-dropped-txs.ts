import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  DroppedTxsEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { storeDroppedTx } from "../../svcs/database/controllers/dropped-tx/store.js";
import { deleteTx } from "../../svcs/database/controllers/l2Tx/index.js";

const onDroppedTxs = async ({ txs }: DroppedTxsEvent) => {
  logger.info(`🗑️ Received ${txs.length} dropped txs to handle`);

  for (const droppedTx of txs) {
    try {
      // Store as dropped transaction
      await storeDroppedTx(droppedTx);

      // Delete from pending transactions
      await deleteTx(droppedTx.txHash);

      logger.info(`✅ Processed dropped tx: ${droppedTx.txHash}`);
    } catch (error) {
      logger.error(`Error processing dropped tx ${droppedTx.txHash}:`, error);
    }
  }
};

export const droppedTxHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "droppedTxHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "DROPPED_TXS_EVENT"),
  cb: onDroppedTxs as (arg0: unknown) => Promise<void>,
};
