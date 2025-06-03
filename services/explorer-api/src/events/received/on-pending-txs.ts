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
import { storeL2Tx } from "../../svcs/database/controllers/l2Tx/index.js";
import { handleDuplicateError } from "./utils.js";

const onPendingTxs = async ({ txs }: PendingTxsEvent) => {
  logger.info(`🕐 Received ${txs.length} pending txs to store`);
  
  // Just try to store each tx in the database
  for (const tx of txs) {
    try {
      const res = chicmozL2PendingTxSchema.parse(tx);
      await storeL2Tx(res);
      logger.debug(`✅ Stored pending tx: ${res.hash}`);
    } catch (e) {
      handleDuplicateError(e as Error, `tx ${tx.hash}`);
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
