import { Logger } from "@chicmoz-pkg/logger-server";
import { SERVICE_NAME } from "./constants.js";

export const logger: Logger = new Logger(SERVICE_NAME);
