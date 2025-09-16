import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { databaseService } from "./database/index.js";
import { messageBusService } from "./message-bus/index.js";

export const services: MicroserviceBaseSvc[] = [
  databaseService,
  messageBusService,
];
