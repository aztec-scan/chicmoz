import { L2NetworkId, l2NetworkIdSchema } from "@chicmoz-pkg/types";
import { z } from "zod";

export const REDIS_HOST = z
  .string()
  .default("redis-cache")
  .parse(process.env.REDIS_HOST);

export const REDIS_PORT = z
  .number()
  .default(6379)
  .parse(process.env.REDIS_PORT);

export const getConfigStr = () => {
  return `REDIS
Host: ${REDIS_HOST}
Port: ${REDIS_PORT}`;
};

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID,
);
