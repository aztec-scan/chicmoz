import { z } from "zod";

export const addNonProdDefault = <T>(
  schema: z.ZodSchema<T>,
  defaultValue: T extends undefined ? never : T,
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

export const aztecNodeConfigSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const aztecNodePoolConfigSchema = z.array(aztecNodeConfigSchema);

export type AztecNodePoolConfig = z.infer<typeof aztecNodePoolConfigSchema>;
export type AztecNodeConfig = z.infer<typeof aztecNodeConfigSchema>;

export const rpcNodePoolSchema = z
  .string()
  .default("local::http://localhost:8080")
  .transform((str) => {
    if (!str) {
      return [];
    }

    const nodes: AztecNodeConfig[] = [];
    const pairs = str.split(",");

    for (const pair of pairs) {
      const [key, url] = pair.split("::");
      if (key && url) {
        nodes.push({
          name: key.trim(),
          url: url.trim(),
        });
      }
    }

    return nodes;
  });
