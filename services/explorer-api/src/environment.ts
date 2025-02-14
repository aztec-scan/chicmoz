import {
  ApiKey,
  NODE_ENV,
  NodeEnv,
  apiKeySchema,
  l2NetworkIdSchema,
  type L2NetworkId,
} from "@chicmoz-pkg/types";
import {
  DEFAULT_VERIFIED_CONTRACT_INSTANCES_DEV,
  DEFAULT_VERIFIED_CONTRACT_INSTANCES_PROD,
} from "./constants.js";

const verifiedContractAddresses =
  NODE_ENV === NodeEnv.PROD
    ? DEFAULT_VERIFIED_CONTRACT_INSTANCES_PROD
    : DEFAULT_VERIFIED_CONTRACT_INSTANCES_DEV;

export const VERIFIED_CONTRACT_INSTANCES_CONTACT = verifiedContractAddresses;

export const PUBLIC_API_KEY: ApiKey = apiKeySchema.parse(
  process.env.PUBLIC_API_KEY
);

export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL) || 60;
export const CACHE_LATEST_TTL_SECONDS =
  Number(process.env.CACHE_LATEST_TTL) || 10;

export const PORT = Number(process.env.PORT) || 80;
export const BODY_LIMIT = process.env.BODY_LIMIT ?? "64kb";
export const ARTIFACT_BODY_LIMIT = process.env.ARTIFACT_BODY_LIMIT ?? "10mb";
export const PARAMETER_LIMIT = Number(process.env.PARAMETER_LIMIT) || 100;

export const DB_MAX_BLOCKS = 20;
export const DB_MAX_TX_EFFECTS = 20;
export const DB_MAX_CONTRACTS = 20;

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID
);
