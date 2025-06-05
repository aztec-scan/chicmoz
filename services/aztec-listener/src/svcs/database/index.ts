import { generateSvc } from "@chicmoz-pkg/postgres-helper";
import * as schema from "./schema.js";

export * as heightsController from "./heights.controller.js";

export const databaseService = generateSvc({ schema });
