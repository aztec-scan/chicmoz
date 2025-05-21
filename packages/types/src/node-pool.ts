import { z } from "zod";

export const AztecNodeConfig = z.object({
  name: z.string(),
  url: z.string(),
});

export type AztecNodeConfig = z.infer<typeof AztecNodeConfig>;

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
