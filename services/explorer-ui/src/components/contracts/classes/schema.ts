import { z } from "zod";

export type ContractClass = z.infer<typeof contractClassSchema>;

export const contractClassSchema = z.object({
  blockHash: z.string(),
  contractClassId: z.string(),
  version: z.number(),
  artifactHash: z.string(),
  privateFunctionsRoot: z.string(),
  sourceCodeUrl: z.string().nullable().optional(),
});
