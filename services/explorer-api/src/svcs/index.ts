import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { cacheService } from "@chicmoz-pkg/redis-helper";
import { databaseService } from "./database/index.js";
import { httpServerService } from "./http-server/index.js";
import { messageBusService } from "./message-bus/index.js";
import { mcpServerService } from "./mcp-server/index.js";

export const services: MicroserviceBaseSvc[] = [
  databaseService,
  cacheService,
  httpServerService,
  messageBusService,
  mcpServerService,
];
