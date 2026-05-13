import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

const contractClassesSummarySchema = z.object({
  totalClasses: z.number(),
  verifiedClasses: z.number(),
  protocolClasses: z.number(),
});

export type ContractClassesSummary = z.infer<
  typeof contractClassesSummarySchema
>;

export const statsL2Api = {
  getL2TotalTxEffects: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalTxEffects);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2TotalTxEffectsLast24h: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalTxEffectsLast24h);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2DroppedTxsLast24h: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2DroppedTxsLast24h);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2TotalContracts: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalContracts);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2TotalContractInstances: async (): Promise<string> => {
    const response = await client.get(
      aztecExplorer.getL2TotalContractInstances,
    );
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2ContractClassesSummary: async (): Promise<ContractClassesSummary> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassesSummary,
    );
    return validateResponse(contractClassesSummarySchema, response.data);
  },
  getL2TotalContractsLast24h: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalContractsLast24h);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2AverageFees: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2AverageFees);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2AverageBlockTime: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2AverageBlockTime);
    return validateResponse(z.coerce.string(), response.data);
  },
  getL2AverageTxsPerBlock: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2AverageTxsPerBlock);
    return validateResponse(z.coerce.string(), response.data);
  },
  getAmountContractClassInstances: async (classId: string): Promise<string> => {
    const response = await client.get(
      aztecExplorer.getAmountContractClassInstances(classId),
    );
    return validateResponse(z.coerce.string(), response.data);
  },
};
