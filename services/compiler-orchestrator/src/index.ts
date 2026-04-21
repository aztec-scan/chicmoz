import {
  startMicroservice,
  type MicroserviceConfig,
} from "@chicmoz-pkg/microservice-base";
import { getConfigStr, SERVICE_NAME } from "./environment.js";
import { logger } from "./logger.js";
import { services } from "./svcs/index.js";
import { start } from "./start.js";

const main = () => {
  const config: MicroserviceConfig = {
    serviceName: SERVICE_NAME,
    logger,
    formattedConfig: getConfigStr(),
    services,
    startCallback: start,
  };
  startMicroservice(config);
};

main();
