import {
  ApiKey,
  apiKeySchema,
  l2NetworkIdSchema,
  type L2NetworkId,
} from "@chicmoz-pkg/types";
import { z } from "zod";

export const PUBLIC_API_KEY: ApiKey = apiKeySchema.parse(
  process.env.PUBLIC_API_KEY,
);

export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL) || 60;
export const CACHE_LATEST_TTL_SECONDS =
  Number(process.env.CACHE_LATEST_TTL) || 10;

export const PORT = Number(process.env.PORT) || 80;
export const BODY_LIMIT = process.env.BODY_LIMIT ?? "64kb";
export const ARTIFACT_BODY_LIMIT = process.env.ARTIFACT_BODY_LIMIT ?? "50mb";
export const PARAMETER_LIMIT = Number(process.env.PARAMETER_LIMIT) || 100;

export const DB_MAX_BLOCKS = 20;
export const DB_MAX_TX_EFFECTS = 100;
export const DB_MAX_CONTRACTS = 20;

export const L2_TIPS_STALE_AFTER_MS =
  Number(process.env.L2_TIPS_STALE_AFTER_MS) || 60_000;

export const L2_BLOCK_RECONCILIATION_ENABLED = z.coerce
  .boolean()
  .default(true)
  .parse(process.env.L2_BLOCK_RECONCILIATION_ENABLED);
export const L2_BLOCK_RECONCILIATION_INTERVAL_MS = z.coerce
  .number()
  .positive()
  .default(60_000)
  .parse(process.env.L2_BLOCK_RECONCILIATION_INTERVAL_MS);
export const L2_BLOCK_RECONCILIATION_SCAN_WINDOW = z.coerce
  .number()
  .int()
  .positive()
  .default(10_000)
  .parse(process.env.L2_BLOCK_RECONCILIATION_SCAN_WINDOW);
export const L2_BLOCK_RECONCILIATION_MAX_BLOCKS = z.coerce
  .number()
  .int()
  .positive()
  .default(500)
  .parse(process.env.L2_BLOCK_RECONCILIATION_MAX_BLOCKS);
export const L2_BLOCK_RECONCILIATION_TIP_REPAIR_WINDOW = z.coerce
  .number()
  .int()
  .positive()
  .default(5)
  .parse(process.env.L2_BLOCK_RECONCILIATION_TIP_REPAIR_WINDOW);

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID,
);
