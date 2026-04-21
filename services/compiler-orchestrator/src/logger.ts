import { Logger } from "@chicmoz-pkg/logger-server";
import { INSTANCE_NAME } from "@chicmoz-pkg/microservice-base";

export const logger: Logger = new Logger(INSTANCE_NAME);
