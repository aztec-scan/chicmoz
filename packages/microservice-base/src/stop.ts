import { type Logger } from "@chicmoz-pkg/logger-server";
import { conf } from "./config.js";
import { setSvcState } from "./health.js";
import { MicroserviceBaseSvcState } from "./types.js";

export const stop = async (logger: Logger) => {
  logger.warn("👼 Trying to shutdown gracefully...");
  for (const svc of conf.services) {
    setSvcState(svc.serviceId, MicroserviceBaseSvcState.SHUTTING_DOWN);
    await svc.shutdown();
  }
  logger.warn("✝ Graceful shutdown complete.");
};
