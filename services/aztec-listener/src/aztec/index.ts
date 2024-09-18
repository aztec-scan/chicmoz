import { IBackOffOptions, backOff } from "exponential-backoff";
import { NodeInfo } from "@chicmoz-pkg/types";
import {
  AZTEC_GENESIS_CATCHUP,
  AZTEC_LISTEN_FOR_BLOCKS,
} from "../constants.js";
import { getHeight as getLatestProcessedHeight } from "../database/latestProcessedHeight.controller.js";
import { logger } from "../logger.js";
import {
  getLatestHeight,
  init as initNetworkClient,
} from "./network-client.js";
import { startPolling, stopPolling } from "./poller.js";
import { startCatchup } from "./genesis-catchup.js";

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

let nodeInfo: NodeInfo;

export const init = async () => {
  nodeInfo = await backOff(async () => {
    return await initNetworkClient();
  }, backOffOptions);
  logger.info(`AZTEC: initialized: ${JSON.stringify(nodeInfo)}`);

  const latestProcessedHeight = await getLatestProcessedHeight();
  const pollFromHeight = latestProcessedHeight
    ? latestProcessedHeight + 1
    : await getLatestHeight();
  if (AZTEC_GENESIS_CATCHUP)
    await startCatchup({ from: 0, to: pollFromHeight });
  if (AZTEC_LISTEN_FOR_BLOCKS)
    startPolling({ fromHeight: pollFromHeight });

  return {
    shutdownAztec: () => {
      stopPolling();
    },
  };
};

export const getNodeInfo = () => nodeInfo;
