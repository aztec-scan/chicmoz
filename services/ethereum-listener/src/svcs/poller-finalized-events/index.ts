import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { logger } from "../../logger.js";
import { DEFAULT_BLOCK_CHUNK_SIZE } from "../../network-client/contracts/get-events.js";
import { getFinalizedContractEvents } from "../../network-client/contracts/index.js";

let started = false;
let timeoutId: NodeJS.Timeout | undefined;
let isFinalizedPollStarted = false;

const pollFinalizedEvents = async () => {
  if (isFinalizedPollStarted) {
    logger.info(
      "Skipping finalized event poll because previous poll is still running",
    );
    return;
  }

  isFinalizedPollStarted = true;
  try {
    await getFinalizedContractEvents();
  } finally {
    isFinalizedPollStarted = false;
  }
};

// eslint-disable-next-line @typescript-eslint/require-await
const init = async () => {
  if (started) {
    return;
  }
  started = true;
  timeoutId = setInterval(() => {
    runCatchup()
      .then((isComplete) => {
        if (isComplete) {
          pollFinalizedEvents().catch((e) => {
            logger.error(
              `🐻 error getting finalized events: ${(e as Error).stack}`,
            );
          });
        }
      })
      .catch((e) => {
        logger.error(`🐻 error running catchup: ${(e as Error).stack}`);
      });
  }, 10000);
};

let isCatchupStarted = false;
let isCatchupComplete = false;
let prevSmallestDiff: bigint | undefined = undefined;
let currSmallestDiff: bigint | undefined = undefined;
let lastLoopStartTimestamp = Date.now();

const runCatchup = async (): Promise<boolean> => {
  if (isCatchupStarted) {
    return isCatchupComplete;
  }
  isCatchupStarted = true;
  let pollersRes = false;
  while (!pollersRes) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const lengthsFromLatestHeight = await getFinalizedContractEvents();
      prevSmallestDiff = currSmallestDiff;
      pollersRes = lengthsFromLatestHeight.every((diff) => {
        if (currSmallestDiff === undefined || diff < currSmallestDiff) {
          currSmallestDiff = diff;
        }
        return diff < DEFAULT_BLOCK_CHUNK_SIZE;
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "";
      if (
        errMsg === "L1 contracts not initialized" ||
        errMsg === "Database is not initialized"
      ) {
        logger.info(
          `🐻 waiting for dependencies during catchup (${errMsg})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        logger.error(
          `🐻 error getting finalized events while catching up: ${
            (e as Error).stack
          }`,
        );
      }
    }
    if (!pollersRes) {
      if (prevSmallestDiff && currSmallestDiff) {
        const now = Date.now();
        const loopDuration = now - lastLoopStartTimestamp;
        lastLoopStartTimestamp = now;
        logger.info(
          `🐻 loop duration: ${
            loopDuration / 1000
          }s, closest behind: ${currSmallestDiff} blocks`,
        );
        const aproxBlocksProcessedInLoop =
          Number(prevSmallestDiff) - Number(currSmallestDiff);
        if (aproxBlocksProcessedInLoop > 0) {
          const timePerBlock = loopDuration / aproxBlocksProcessedInLoop;
          logger.info(
            `🐻🐻 estimated time to catch up: ${
              (timePerBlock * Number(currSmallestDiff)) / 1000 / 60 / 60
            } hrs`,
          );
        } else {
          logger.info(
            `🐻🐻 no catchup progress in last loop; progressBlocks=${aproxBlocksProcessedInLoop}, skipping ETA`,
          );
        }
      }
    }
  }
  logger.info("🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻 catchup complete");
  isCatchupComplete = true;
  return isCatchupComplete;
};

// eslint-disable-next-line @typescript-eslint/require-await
const shutdown = async () => {
  if (timeoutId) {
    clearInterval(timeoutId);
    timeoutId = undefined;
  }
};

export const finalizedEventsPollerService: MicroserviceBaseSvc = {
  svcId: "finalizedEventsPoller",
  init,
  shutdown,
  health: () => true,
  getConfigStr: () => `N/A`, // TODO: add config
};
