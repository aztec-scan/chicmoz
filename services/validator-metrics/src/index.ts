import {
  startMicroservice,
  type MicroserviceConfig,
} from "@chicmoz-pkg/microservice-base";
import { SERVICE_NAME } from "./constants.js";
import { logger } from "./logger.js";
import { start } from "./start.js";
import { services } from "./svcs/index.js";

const formatConfigLog = () => {
  return `TODO: is this needed if each service logs?`;
};

const main = () => {
  const config: MicroserviceConfig = {
    serviceName: SERVICE_NAME,
    logger,
    formattedConfig: formatConfigLog(),
    services,
    startCallback: start,
  };
  startMicroservice(config);
};

main();
