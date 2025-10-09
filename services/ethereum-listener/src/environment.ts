import { type L2NetworkId, l2NetworkIdSchema } from "@chicmoz-pkg/types";

export const BLOCK_POLL_INTERVAL_MS =
  Number(process.env.BLOCK_POLL_INTERVAL_MS) || 5000;
export const LISTEN_FOR_BLOCKS = process.env.LISTEN_FOR_BLOCKS === "true";
export const GENESIS_CATCHUP = process.env.GENESIS_CATCHUP === "true";
export const LISTENER_DISABLED = process.env.LISTENER_DISABLED === "true";

export const ETHEREUM_HTTP_RPC_URL =
  process.env.ETHEREUM_HTTP_RPC_URL ?? "http://anvil-ethereum-node:8545";
export const ETHEREUM_WS_RPC_URL =
  process.env.ETHEREUM_WS_RPC_URL ?? "ws://anvil-ethereum-node:8545";

export const ETHEREUM_ALCHEMY_HTTP_URL = process.env.ETHEREUM_ALCHEMY_HTTP_URL;

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID,
);

// Attesters calls
export const BATCH_SIZE = parseInt(process.env.ATTESTER_BATCH_SIZE ?? "5", 10);
export const BATCH_DELAY_MS = parseInt(
  process.env.BATCH_DELAY_MS ?? "1000",
  10,
);
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? "3", 10);
export const INITIAL_BACKOFF_MS = parseInt(
  process.env.INITIAL_BACKOFF_MS ?? "1000",
  10,
);
export const CIRCUIT_BREAKER_THRESHOLD = parseInt(
  process.env.CIRCUIT_BREAKER_THRESHOLD ?? "5",
  10,
);
export const CIRCUIT_BREAKER_TIMEOUT_MS = parseInt(
  process.env.CIRCUIT_BREAKER_TIMEOUT_MS ?? "30000",
  10,
);
