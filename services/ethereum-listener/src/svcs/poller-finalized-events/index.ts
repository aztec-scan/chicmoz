import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { logger } from "../../logger.js";
import { DEFAULT_BLOCK_CHUNK_SIZE } from "../../network-client/contracts/get-events.js";
import { getFinalizedContractEvents } from "../../network-client/contracts/index.js";

let started = false;
let timoutId: NodeJS.Timeout | undefined;

// eslint-disable-next-line @typescript-eslint/require-await
const init = async () => {
  if (started) {
    return;
  }
  started = true;
  timoutId = setInterval(() => {
    runCatchup()
      .then((isComplete) => {
        if (isComplete) {
          getFinalizedContractEvents().catch((e) => {
            logger.error(
              `🐻 error getting finalized events: ${(e as Error).stack}`,
            );
          });
        }
      })
      .catch((e) => {
        logger.error(`🐻 error running catchup: ${(e as Error).stack}`);
      });
  }, 5000);
  //await queryStakingStateAndEmitUpdates();
};

let isCatchupStarted = false;
let isCatchupComplete = false;
let prevSmallestDiff: bigint | undefined = undefined;
let currSmallestDiff: bigint | undefined = undefined;
let lastLoopStartTimestamp = Date.now();

const runCatchup = async () => {
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
      if (e instanceof Error && e.message === "L1 contracts not initialized") {
        logger.info(
          "🐻 waiting for contracts to be initialized during catchup...",
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
        const timePerBlock = loopDuration / aproxBlocksProcessedInLoop;
        logger.info(
          `🐻🐻 estimated time to catch up: ${
            (timePerBlock * Number(currSmallestDiff)) / 1000 / 60 / 60
          } hrs`,
        );
      }
    }
  }
  logger.info("🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻🐻 catchup complete");
  isCatchupComplete = true;
};

// eslint-disable-next-line @typescript-eslint/require-await
const shutdown = async () => {
  if (timoutId) {
    clearInterval(timoutId);
    timoutId = undefined;
  }
};

export const finalizedEventsPollerService: MicroserviceBaseSvc = {
  svcId: "finalizedEventsPoller",
  init,
  shutdown,
  health: () => true,
  getConfigStr: () => `N/A`, // TODO: add config
};
