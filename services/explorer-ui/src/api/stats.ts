import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";
import { z } from "zod";

export const statsL2Api = {
  getL2TotalTxEffects: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalTxEffects);
    return validateResponse(z.string(), response.data);
  },
  getL2TotalTxEffectsLast24h: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalTxEffectsLast24h);
    return validateResponse(z.string(), response.data);
  },
  getL2TotalContracts: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2TotalContracts);
    return validateResponse(z.string(), response.data);
  },
  getL2AverageFees: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2AverageFees);
    return validateResponse(z.string(), response.data);
  },
  getL2AverageBlockTime: async (): Promise<string> => {
    const response = await client.get(aztecExplorer.getL2AverageBlockTime);
    return validateResponse(z.string(), response.data);
  },
};
