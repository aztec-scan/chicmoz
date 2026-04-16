import type { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { jobManagerService } from "./job-manager/index.js";
import { messageBusService } from "./message-bus/index.js";

export const services: MicroserviceBaseSvc[] = [
  messageBusService,
  jobManagerService,
];
