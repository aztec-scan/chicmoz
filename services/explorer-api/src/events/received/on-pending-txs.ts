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
import {
  deleteTx,
  getTxs,
  storeL2Tx,
} from "../../svcs/database/controllers/l2Tx/index.js";
import { handleDuplicateError } from "./utils.js";

const onPendingTxs = async ({ txs }: PendingTxsEvent) => {
  const dbTxs = await getTxs();
  const staleTxs = dbTxs.filter(
    (dbTx) => !txs.some((tx) => tx.hash === dbTx.hash),
  );
  for (const tx of txs) {
    const res = chicmozL2PendingTxSchema.parse(tx);
    await storeL2Tx(res).catch((e) => {
      handleDuplicateError(e as Error, `tx ${res.hash}`);
    });
  }
  if (staleTxs.length > 0) {
    // TODO: perhaps emit an event to websockets?
    logger.info(`🕐🕐🕐 Stale txs: ${staleTxs.length}. Deleting...`);
    for (const tx of staleTxs) {
      try {
        await deleteTx(tx.hash);
      } catch (e) {
        logger.error(
          `Error deleting stale tx ${tx.hash}: ${(e as Error).stack}`,
        );
      }
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
