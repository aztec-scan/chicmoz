import {
  MicroserviceBaseSvcState,
  getSvcState,
  type MicroserviceBaseSvc,
} from "@chicmoz-pkg/microservice-base";
import { DrizzleConfig } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { dbCredentials, getConfigStr } from "./environment.js";

let client: pg.Client;
let db: ReturnType<typeof drizzle>;

const serviceId = "DB";

const init = async (drizzleConfig: DrizzleConfig<Record<string, unknown>>) => {
  client = new pg.Client(dbCredentials);
  db = drizzle(client, drizzleConfig);
  await client.connect();
};

export const getDb = () => {
  try {
    const state = getSvcState(serviceId);
    if (state === MicroserviceBaseSvcState.SHUTTING_DOWN)
      {throw new Error("Database is shutting down");}
    if (state === MicroserviceBaseSvcState.DOWN)
      {throw new Error("Database is down");}
    if (state === MicroserviceBaseSvcState.INITIALIZING)
      {throw new Error("Database is initializing");}
  } catch (error) {
    throw new Error("Database is not initialized");
  }
  return db;
};

export const generateSvc: (
  drizzleConf: DrizzleConfig<Record<string, unknown>>,
) => MicroserviceBaseSvc = (drizzleConf) => ({
  svcId: "DB",
  init: () => init(drizzleConf),
  getConfigStr,
  health: () => getSvcState(serviceId) === MicroserviceBaseSvcState.UP,
  shutdown: async () => {
    await client.end();
  },
});
