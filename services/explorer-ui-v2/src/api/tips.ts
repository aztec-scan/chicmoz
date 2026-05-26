import {
  type ChicmozL2TipsHealth,
  chicmozL2TipsHealthSchema,
} from "@chicmoz-pkg/types";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const TipsAPI = {
  getL2TipsHealth: async (): Promise<ChicmozL2TipsHealth> => {
    const response = await client.get(aztecExplorer.getL2Tips);
    return validateResponse(chicmozL2TipsHealthSchema, response.data);
  },
};
