import { generateSvc } from "@chicmoz-pkg/postgres-helper";
import {
  l1Schemas,
  l2Schemas,
  sentinelSchemas,
} from "@chicmoz-pkg/database-registry";

export * as controllers from "./controllers/index.js";

export const databaseService = generateSvc({
  schema: { ...l1Schemas, ...l2Schemas, ...sentinelSchemas },
});
