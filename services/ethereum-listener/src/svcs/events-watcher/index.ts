import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { logger } from "../../logger.js";
import { watchContractsEvents } from "../../network-client/index.js";

let started = false;
let unwatchAllContracts: (() => void) | undefined;

export const refreshWatchers = async () => {
  await stopWatchers();
  unwatchAllContracts = await watchContractsEvents();
};

// eslint-disable-next-line @typescript-eslint/require-await
export const ensureStarted = async () => {
  if (started) {return;}
  unwatchAllContracts = await watchContractsEvents();
  started = true;
};

// eslint-disable-next-line @typescript-eslint/require-await
const stopWatchers = async () => {
  if (unwatchAllContracts) {
    unwatchAllContracts();
    unwatchAllContracts = undefined;
  }
};

export const eventsWatcherService: MicroserviceBaseSvc = {
  svcId: "eventsWatcher",
  init: async () => {
    try {
      await ensureStarted();
    } catch (e) {
      if (e instanceof Error && e.message === "L1 contracts not initialized") {
        logger.info(
          "⚠️  L1 contracts not initialized, waiting for chain info event"
        );
      } else {
        throw e;
      }
    }
  },
  shutdown: stopWatchers,
  health: () => true,
  getConfigStr: () => `N/A`,
};
