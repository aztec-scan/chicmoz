import { Tx } from "@aztec/aztec.js";
import { TX_POLL_INTERVAL_MS } from "../../../environment.js";
import { onPendingTxs } from "../../../events/emitted/index.js";
import { logger } from "../../../logger.js";
import { getBalanceOf, getPendingTxs } from "../network-client/index.js";

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

const internalOnPendingTxs = async (pendingTxs: Tx[]) => {
  const feePayer = pendingTxs.at(0)?.data.feePayer;
  if (feePayer) {
    logger.info(`
feePayer: ${feePayer.toString()}
`);
    const balance = await getBalanceOf("latest", feePayer);
    logger.info(`
feePayer current balance: ${balance.toBigInt()}
`);
  }
  const pendingTxsHashes = await Promise.all(
    pendingTxs.map((tx) => {
      return tx.getTxHash();
    }),
  );

  // Send all pending txs, not just new ones
  await onPendingTxs(pendingTxsHashes);
};

const fetchAndPublishPendingTxs = async () => {
  try {
    const txs = await getPendingTxs();
    await internalOnPendingTxs(txs);
  } catch (error) {
    logger.warn("Error fetching pending txs", error);
  }
};
