import {
  type L2NetworkId,
  l2NetworkIdSchema,
} from "@chicmoz-pkg/types";

export const BLOCK_POLL_INTERVAL_MS =
  Number(process.env.BLOCK_INTERVAL_MS) || 500;
export const LISTEN_FOR_BLOCKS = process.env.LISTEN_FOR_BLOCKS === "true";
export const GENESIS_CATCHUP = process.env.GENESIS_CATCHUP === "true";
export const LISTENER_DISABLED = process.env.LISTENER_DISABLED === "true";

export const ETHEREUM_HTTP_RPC_URL =
  process.env.ETHEREUM_HTTP_RPC_URL ?? "http://anvil-ethereum-node:8545";
export const ETHEREUM_WS_RPC_URL =
  process.env.ETHEREUM_WS_RPC_URL ?? "ws://anvil-ethereum-node:8545";

export const ETHEREUM_ALCHEMY_HTTP_URL = process.env.ETHEREUM_ALCHEMY_HTTP_URL;

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID
);
