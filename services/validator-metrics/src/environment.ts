import {
  l2NetworkIdSchema,
  type L2NetworkId,
} from "@chicmoz-pkg/types";

export const PORT = Number(process.env.PORT) || 80;

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID
);
