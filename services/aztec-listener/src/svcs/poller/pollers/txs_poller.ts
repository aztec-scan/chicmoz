import { TX_POLL_INTERVAL_MS } from "../../../environment.js";
import { onPendingTxs } from "../../../events/emitted/on-pending-txs.js";
import { logger } from "../../../logger.js";
import { getPendingTxs } from "../network-client/index.js";

let pollInterval: NodeJS.Timeout;

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

const fetchAndPublishPendingTxs = async () => {
  try {
    const txs = await getPendingTxs();
    await onPendingTxs(txs);
  } catch (error) {
    logger.warn("Error fetching pending txs", error);
  }
};
