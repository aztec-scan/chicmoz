import {
  type ChicmozL1ContractEventsHourlyCounts,
  type ChicmozL1GenericContractEvent,
  chicmozL1ContractEventsHourlyCountsSchema,
  chicmozL1GenericContractEventSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const L1ContractEventAPI = {
  getContractEvents: async (): Promise<ChicmozL1GenericContractEvent[]> => {
    const response = await client.get(aztecExplorer.getL1ContractEvents);
    return validateResponse(
      z.array(chicmozL1GenericContractEventSchema),
      response.data,
    );
  },
  getHourlyCounts: async (
    hours: number,
  ): Promise<ChicmozL1ContractEventsHourlyCounts> => {
    const response = await client.get(
      aztecExplorer.getL1ContractEventsHourlyCounts,
      { params: { hours } },
    );
    return validateResponse(
      chicmozL1ContractEventsHourlyCountsSchema,
      response.data,
    );
  },
};
