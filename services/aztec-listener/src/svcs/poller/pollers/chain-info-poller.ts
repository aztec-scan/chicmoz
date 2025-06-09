import { CHAIN_INFO_POLL_INTERVAL_MS } from "../../../environment.js";
import { logger } from "../../../logger.js";
import { getFreshInfo } from "../network-client/index.js";

let pollInterval: NodeJS.Timeout;

export const startPolling = () => {
  pollInterval = setInterval(() => {
    getFreshInfo().catch((error) => {
      logger.info("Error fetching chain info", error);
    });
  }, CHAIN_INFO_POLL_INTERVAL_MS);
};

export const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
};
