import { IBackOffOptions, backOff } from "exponential-backoff";
import { logger } from "../logger.js";
import { getLatestHeight, initClient } from "./client.js";
export { watchContractsEvents } from "./client.js";

const backOffOptions: Partial<IBackOffOptions> = {
  numOfAttempts: 10,
  maxDelay: 10000,
  retry: (e, attemptNumber: number) => {
    logger.warn(e);
    logger.info(
      `🤡 We'll allow some errors during start-up, retrying attempt ${attemptNumber}...`
    );
    return true;
  },
};

export const init = async () => {
  initClient();
  const l1BlockNumber = await backOff(async () => {
    return await getLatestHeight();
  }, backOffOptions);
  logger.info(`ETH: initialized, currently on height ${l1BlockNumber}`);
};
