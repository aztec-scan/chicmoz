import { chicmozL2ContractClassRegisteredEventSchema } from "@chicmoz-pkg/types";
import { z } from "zod";

export type ContractInstance = z.infer<typeof contractInstanceSchema>;

export const contractInstanceSchema = z.object({
  address: z.string(),
  blockHash: z.string(),
  blockHeight: z.number().optional(),
  version: z.number(),
  contractClassId: z.string(),
  deployer: z.string(),
  contractTypeSchema: z
    .lazy(
      () =>
        chicmozL2ContractClassRegisteredEventSchema.shape.standardContractType,
    )
    .nullable()
    .optional(),
  aztecScanOriginNotes: z
    .object({
      comment: z.string(),
    })
    .optional(),
});
