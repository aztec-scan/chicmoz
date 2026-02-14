export const PORT = Number(process.env.PORT) || 5000;

export const BODY_LIMIT = process.env.BODY_LIMIT ?? "64kb";
export const PARAMETER_LIMIT = Number(process.env.PARAMETER_LIMIT) || 100;
export const NODE_ENV = process.env.NODE_ENV ?? "development";

export const POSTGRES_IP = process.env.POSTGRES_IP ?? "localhost";
export const POSTGRES_PORT = Number(process.env.POSTGRES_PORT) || 5432;
export const POSTGRES_DB_NAME = process.env.POSTGRES_DB_NAME ?? "auth";
export const POSTGRES_ADMIN = process.env.POSTGRES_ADMIN ?? "admin";
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "test";

export const KAFKA_CONNECTION = process.env.KAFKA_CONNECTION ?? "kafka:9092";
export const KAFKA_SASL_USERNAME =
  process.env.KAFKA_SASL_USERNAME ?? "controller_user";
export const KAFKA_SASL_PASSWORD = process.env.KAFKA_SASL_PASSWORD ?? "test";

export const SERVICE_NAME = process.env.SERVICE_NAME ?? "auth";

export const REDIS_HOST = process.env.REDIS_HOST ?? "redis-cache";
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
