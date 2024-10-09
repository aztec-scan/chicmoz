import { SERVICE_NAME } from "./constants.js";
import { logger } from "./logger.js";
import { start } from "./start.js";
import { gracefulShutdown } from "./stop.js";

const main = async () => {
  logger.info(`🚀 ${SERVICE_NAME} starting...`);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.on("SIGINT", gracefulShutdown());
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.on("SIGTERM", gracefulShutdown());
  await start();
  logger.info(`🥳 ${SERVICE_NAME} started!`);
};

main().catch((e) => {
  logger.error(`during startup of ${SERVICE_NAME}: ${e}`);
  process.exit(1);
});
