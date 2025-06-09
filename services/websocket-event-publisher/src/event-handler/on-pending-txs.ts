import { PendingTxsEvent } from "@chicmoz-pkg/message-registry";
import { logger } from "../logger.js";
import { sendPendingTxsToClients } from "../ws-server/index.js";

export const onPendingTxs = ({ txs }: PendingTxsEvent) => {
  sendPendingTxsToClients(txs);
  logger.info(`🕐 Sent ${txs.length} pending txs to clients`);
};
