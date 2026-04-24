import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  PendingTxsEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { chicmozL2PendingTxSchema } from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { storeOrUpdateL2Tx } from "../../svcs/database/controllers/l2Tx/index.js";
import { removeDroppedTxByHash } from "../../svcs/database/controllers/dropped-tx/index.js";
import { handleDuplicateError } from "./utils.js";

const onPendingTxs = async ({ txs }: PendingTxsEvent) => {
  logger.info(`🕐 Received ${txs.length} pending txs to store`);

  for (const tx of txs) {
    try {
      const res = chicmozL2PendingTxSchema.parse(tx);

      // Handle resubmissions: remove from dropped table if exists
      const removedCount = await removeDroppedTxByHash(res.txHash);
      if (removedCount > 0) {
        logger.info(
          `🔄 Resubmitted tx ${res.txHash}: removed from dropped table`,
        );
      }
      // Store/update in pending table (handles both new and resubmitted transactions)
      await storeOrUpdateL2Tx(res);
      logger.debug(`✅ Stored/updated pending tx: ${res.txHash}`);
    } catch (e) {
      handleDuplicateError(e as Error, `tx ${tx.txHash}`);
    }
  }
};

export const pendingTxHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "pendingTxHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "PENDING_TXS_EVENT"),
  cb: onPendingTxs as (arg0: unknown) => Promise<void>,
};
