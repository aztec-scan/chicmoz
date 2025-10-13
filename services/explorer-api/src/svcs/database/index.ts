import { generateSvc } from "@chicmoz-pkg/postgres-helper";
import * as explorerSchema from "./schema/index.js";
import * as sharedSchema from "@chicmoz-pkg/database-registry"

export * as controllers from "./controllers/index.js";

export const databaseService = generateSvc({ schema: { ...explorerSchema, ...sharedSchema } });
