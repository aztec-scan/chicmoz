import { z } from "zod";

export const addNonProdDefault = <T>(
  schema: z.ZodSchema<T>,
  defaultValue: T extends undefined ? never : T
): z.ZodSchema<T> | z.ZodDefault<z.ZodType<T, z.ZodTypeDef, T>> => {
  if (NODE_ENV === NodeEnv.PROD) {
    return schema;
  }
  return schema.default(defaultValue);
};

export enum NodeEnv {
  DEV = "development",
  PROD = "production",
  TEST = "test",
}
export const nodeEnvSchema = z.enum([NodeEnv.DEV, NodeEnv.PROD, NodeEnv.TEST]);
export const NODE_ENV: NodeEnv = nodeEnvSchema
  .default(NodeEnv.DEV)
  .parse(process.env.NODE_ENV);

export enum ApiKey {
  DEV = "dev-api-key",
  PROD_PUBLIC = "temporary-api-key",
}

const _apiSchema = z.enum([ApiKey.DEV, ApiKey.PROD_PUBLIC]);
export const apiKeySchema = addNonProdDefault(_apiSchema, ApiKey.DEV);
