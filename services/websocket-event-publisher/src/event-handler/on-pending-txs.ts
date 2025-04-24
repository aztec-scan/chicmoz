import { PendingTxsEvent } from "@chicmoz-pkg/message-registry";
import { logger } from "../logger.js";
import { sendPendingTxsToClients } from "../ws-server/index.js";

// Track already handled transaction hashes
let handledTxs: `0x${string}`[] = [];

export const onPendingTxs = ({ txs }: PendingTxsEvent) => {
  // Filter out already handled transactions by checking the hash property
  const newTxs = txs.filter((tx) => !handledTxs.includes(tx.hash));

  if (newTxs.length > 0) {
    // Send only new transactions to clients
    sendPendingTxsToClients(newTxs);
    logger.info(`🕐 Sent ${newTxs.length} pending txs to clients`);
  }

  // Update handledTxs with all current pending transaction hashes
  handledTxs = txs.map((tx) => tx.hash);
};
