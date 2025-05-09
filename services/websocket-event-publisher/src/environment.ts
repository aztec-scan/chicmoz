import {
  l2NetworkIdSchema,
  type L2NetworkId,
} from "@chicmoz-pkg/types";
export const PORT = Number(process.env.PORT) || 5000;
export const NODE_ENV = process.env.NODE_ENV ?? "development";

export const KAFKA_CONNECTION_URL =
  process.env.KAFKA_CONNECTION_URL ?? "kafka:9092";
export const KAFKA_SASL_USERNAME =
  process.env.KAFKA_SASL_USERNAME ?? "controller_user";
export const KAFKA_SASL_PASSWORD = process.env.KAFKA_SASL_PASSWORD ?? "test";

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID
);
