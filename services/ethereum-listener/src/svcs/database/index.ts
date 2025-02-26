import { generateSvc } from "@chicmoz-pkg/postgres-helper";
import * as schema from "./schema.js";

export * as controllers from "./controllers/index.js";

export const databaseService = generateSvc({ schema });
