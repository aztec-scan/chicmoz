import { type L2NetworkId, l2NetworkIdSchema } from "@chicmoz-pkg/types";

export const BLOCK_POLL_INTERVAL_MS =
  Number(process.env.BLOCK_POLL_INTERVAL_MS) || 5000;
export const LISTEN_FOR_BLOCKS = process.env.LISTEN_FOR_BLOCKS === "true";
export const LISTENER_DISABLED = process.env.LISTENER_DISABLED === "true";

export const ETHEREUM_HTTP_RPC_URL =
  process.env.ETHEREUM_HTTP_RPC_URL ?? "http://anvil-ethereum-node:8545";
export const ETHEREUM_WS_RPC_URL =
  process.env.ETHEREUM_WS_RPC_URL ?? "ws://anvil-ethereum-node:8545";

export const ETHEREUM_ALCHEMY_HTTP_URL = process.env.ETHEREUM_ALCHEMY_HTTP_URL;

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID,
);

export const ATTESTER_POLL_INTERVAL_MS = parseInt(
  process.env.ATTESTER_POLL_INTERVAL_MS ?? 15 * 60 * 1000 + "",
  10,
);
export const BATCH_SIZE = parseInt(process.env.ATTESTER_BATCH_SIZE ?? "5", 10);
export const ATTESTER_BATCH_DELAY_MS = parseInt(
  process.env.ATTESTER_BATCH_DELAY_MS ?? "1000",
  10,
);
export const ATTESTER_MAX_RETRIES = parseInt(
  process.env.ATTESTER_MAX_RETRIES ?? "3",
  10,
);
export const ATTESTER_INITIAL_BACKOFF_MS = parseInt(
  process.env.ATTESTER_INITIAL_BACKOFF_MS ?? "1000",
  10,
);
export const ATTESTER_CIRCUIT_BREAKER_THRESHOLD = parseInt(
  process.env.ATTESTER_CIRCUIT_BREAKER_THRESHOLD ?? "5",
  10,
);
export const ATTESTER_CIRCUIT_BREAKER_TIMEOUT_MS = parseInt(
  process.env.ATTESTER_CIRCUIT_BREAKER_TIMEOUT_MS ?? "30000",
  10,
);
