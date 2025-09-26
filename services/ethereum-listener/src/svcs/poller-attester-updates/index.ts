import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { logger } from "../../logger.js";
import { getAttestersView } from "../../network-client/contracts/index.js";

let started = false;
let timeoutId: NodeJS.Timeout | undefined;
let isUpdating = false;
let lastUpdateStartTime = 0;
let lastUpdateDuration = 0;

// Poll attesters every 15 minutes (900,000ms) instead of every minute
const ATTESTER_POLL_INTERVAL_MS = 15 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/require-await
const init = async () => {
  if (started) {
    return;
  }
  started = true;

  // Run immediately on startup
  updateAttesters().catch((e) => {
    logger.error(`🔍 error on initial attester update: ${(e as Error).stack}`);
  });

  // Then schedule regular updates
  timeoutId = setInterval(() => {
    updateAttesters().catch((e) => {
      logger.error(`🔍 error updating attesters: ${(e as Error).stack}`);
    });
  }, ATTESTER_POLL_INTERVAL_MS);

  logger.info(
    `🔍 Attester poller started - will update every ${ATTESTER_POLL_INTERVAL_MS / 1000 / 60} minutes`,
  );
};

const updateAttesters = async () => {
  if (isUpdating) {
    const timeSinceStart = Date.now() - lastUpdateStartTime;
    const estimatedTimeLeft = Math.max(0, lastUpdateDuration - timeSinceStart);

    logger.warn(
      `🔍 Skipping attester update - already in progress for ${Math.round(timeSinceStart / 1000)}s. ` +
        `Estimated time remaining: ${Math.round(estimatedTimeLeft / 1000)}s`,
    );
    return;
  }

  isUpdating = true;
  lastUpdateStartTime = Date.now();

  try {
    logger.info("🔍 Starting attester view update...");

    await getAttestersView();

    const duration = Date.now() - lastUpdateStartTime;
    lastUpdateDuration = duration;
    logger.info(
      `🔍 Attester update completed in ${Math.round(duration / 1000)}s`,
    );
  } catch (error) {
    const duration = Date.now() - lastUpdateStartTime;
    lastUpdateDuration = duration;

    if (
      error instanceof Error &&
      error.message === "L1 contracts not initialized"
    ) {
      logger.info("🔍 Waiting for contracts to be initialized...");
    } else {
      logger.error(
        `🔍 Attester update failed after ${Math.round(duration / 1000)}s: ${String(error)}`,
      );
      throw error;
    }
  } finally {
    isUpdating = false;
  }
};

// eslint-disable-next-line @typescript-eslint/require-await
const shutdown = async () => {
  if (timeoutId) {
    clearInterval(timeoutId);
    timeoutId = undefined;
  }
  started = false;
  logger.info("🔍 Attester poller stopped");
};

export const attesterPollerService: MicroserviceBaseSvc = {
  svcId: "attesterPoller",
  init,
  shutdown,
  health: () => true,
  getConfigStr: () => {
    const intervalMin = ATTESTER_POLL_INTERVAL_MS / 1000 / 60;
    const status = isUpdating ? "UPDATING" : "IDLE";
    const lastDurationMin = lastUpdateDuration
      ? Math.round(lastUpdateDuration / 1000 / 60)
      : "N/A";
    return `Interval: ${intervalMin}min, Status: ${status}, Last duration: ${lastDurationMin}min`;
  },
};
