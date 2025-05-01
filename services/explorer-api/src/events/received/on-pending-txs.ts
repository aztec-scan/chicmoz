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
import { storeDroppedTx } from "../../svcs/database/controllers/dropped-tx/store.js";
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
  const newTxs = txs.filter(
    (tx) => !dbTxs.some((dbTx) => tx.hash === dbTx.hash),
  );
  logger.info(
    `🕐 total pending txs: ${txs.length}, new txs: ${newTxs.length}, stale txs: ${staleTxs.length}`,
  );
  for (const tx of newTxs) {
    const res = chicmozL2PendingTxSchema.parse(tx);
    await storeL2Tx(res).catch((e) => {
      handleDuplicateError(e as Error, `tx ${res.hash}`);
    });
  }
  if (staleTxs.length > 0) {
    // TODO: perhaps emit an event to websockets?
    for (const tx of staleTxs) {
      try {
        // Store as dropped transaction before deleting
        logger.info(`🗑️🕐 trying to store tx as dropped ${tx.hash}`);
        await storeDroppedTx({
          txHash: tx.hash,
          createdAt: new Date(tx.birthTimestamp),
          droppedAt: new Date(),
        });

        // Then delete the pending transaction
        await deleteTx(tx.hash);
      } catch (e) {
        logger.error(
          `Error handling stale tx ${tx.hash}: ${(e as Error).stack}`,
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
