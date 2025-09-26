import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { databaseService } from "./database/index.js";
import { messageBusService } from "./message-bus/index.js";
import { ethereumNetworkClientService } from "./network-client/index.js";
import { finalizedEventsPollerService } from "./poller-finalized-events/index.js";
import { attesterPollerService } from "./poller-attester-updates/index.js";
import { eventsWatcherService } from "./events-watcher/index.js";

export const services: MicroserviceBaseSvc[] = [
  databaseService,
  messageBusService,
  ethereumNetworkClientService,
  eventsWatcherService,
  finalizedEventsPollerService,
  attesterPollerService,
];
