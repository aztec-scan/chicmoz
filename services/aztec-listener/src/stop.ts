import { SERVICE_NAME } from "./constants.js";
import { logger } from "./logger.js";

const registeredShutdownCallbacks: ({
  id: string;
  shutdownCb: () => Promise<void>;
})[] = [];

export const registerShutdownCallback = ({id, shutdownCb}: {id: string, shutdownCb: () => Promise<void>}) => {
  registeredShutdownCallbacks.push({ id, shutdownCb });
};

const _gracefulShutdown = async () => {
  try {
    for (const shutdown of registeredShutdownCallbacks) {
      logger.info(`💥 Shutting down ${shutdown.id}...`);
      await shutdown.shutdownCb();
    }
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`during shutdown of ${SERVICE_NAME}: ${e}`);
    process.exit(1);
  }
};

export const gracefulShutdown = () => async () => {
  logger.info("Starting graceful shutdown...");
  await _gracefulShutdown();
  logger.info("Graceful shutdown complete.");
};

