import { generateSvc } from "@chicmoz-pkg/postgres-helper";
import * as explorerSchemas from "./schema/index.js";
import {
  l1Schemas,
  l2Schemas,
  sentinelSchemas,
} from "@chicmoz-pkg/database-registry";

export * as controllers from "./controllers/index.js";

export const databaseService = generateSvc({
  schema: {
    ...explorerSchemas,
    ...l1Schemas,
    ...l2Schemas,
    ...sentinelSchemas,
  },
});
