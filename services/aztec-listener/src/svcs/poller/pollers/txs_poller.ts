import { Tx } from "@aztec/aztec.js";
import { TX_POLL_INTERVAL_MS } from "../../../environment.js";
import { onPendingTxs } from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";
import { getPendingTxs } from "../network-client/index.js";

let pollInterval: NodeJS.Timeout;

let handledTxs: `0x${string}`[] = [];

export const startPolling = () => {
  pollInterval = setInterval(() => {
    void fetchAndPublishPendingTxs();
  }, TX_POLL_INTERVAL_MS);
};

export const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
};

const internalOnPendingTxs = async (pendingTxs: Tx[]) => {
  const pendingTxsHashes = await Promise.all(
    pendingTxs.map((tx) => {
      return tx.getTxHash();
    }),
  );
  const newPendingTxsHashes = pendingTxsHashes.filter(
    (tx) => !handledTxs.includes(tx.toString()),
  );
  if (newPendingTxsHashes.length === 0) {
    return;
  }
  await onPendingTxs(newPendingTxsHashes);
  handledTxs = pendingTxsHashes.map((tx) => tx.toString());
};

const fetchAndPublishPendingTxs = async () => {
  try {
    const txs = await getPendingTxs();
    await internalOnPendingTxs(txs);
  } catch (error) {
    logger.warn("Error fetching pending txs", error);
  }
};
