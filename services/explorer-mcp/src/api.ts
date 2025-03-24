import { ChicmozL2BlockLight, chicmozL2BlockLightSchema } from "@chicmoz-pkg/types";
import client, { validateResponse } from "./client.js";
import { ENDPOINTS } from "./config.js";
import { z } from "zod";

export const BlockAPI = {
  getLatestBlock: async (): Promise<ChicmozL2BlockLight> => {
    const response = await client.get(ENDPOINTS.getL2LatestBlock);

    return validateResponse(chicmozL2BlockLightSchema, response.data);
  },
  getLatestHeight: async (): Promise<string> => {
    const response = await client.get(ENDPOINTS.getL2LatestHeight);
    return validateResponse(z.string(), response.data);
  },
};
