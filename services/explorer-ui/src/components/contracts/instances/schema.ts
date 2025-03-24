import { z } from "zod";

export type ContractInstance = z.infer<typeof contractInstanceSchema>;

export const contractInstanceSchema = z.object({
  address: z.string(),
  blockHash: z.string(),
  blockHeight: z.number().optional(),
  version: z.number(),
  contractClassId: z.string(),
  deployer: z.string(),
  contractType: z.number().optional(),
  aztecScanOriginNotes: z.object({
    comment: z.string(),
  }).optional(),
});

// Helper function to determine if a contract is a trusted portal
export const isTrustedPortal = (contract: ContractInstance): boolean => {
  // ContractType.Portal is 1 (enum value)
  return contract.contractType === 1;
};
