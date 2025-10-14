import {
  chicmozL1L2ValidatorHistorySchema,
  chicmozL1L2ValidatorSchema,
  type ChicmozL1L2Validator,
  type ChicmozL1L2ValidatorHistory,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const L1L2ValidatorAPI = {
  getValidators: async (
    limit?: number,
    offset?: number,
  ): Promise<ChicmozL1L2Validator[]> => {
    const params: { limit?: number; offset?: number } = {};
    if (limit) {
      params.limit = limit;
    }
    if (offset) {
      params.offset = offset;
    }
    const response = await client.get(aztecExplorer.getL1L2Validators, {
      params,
    });
    return validateResponse(z.array(chicmozL1L2ValidatorSchema), response.data);
  },
  getValidatorByAddress: async (
    address: string,
  ): Promise<ChicmozL1L2Validator> => {
    const response = await client.get(aztecExplorer.getL1L2Validator(address));
    return validateResponse(chicmozL1L2ValidatorSchema, response.data);
  },
  getValidatorHistory: async (
    address: string,
  ): Promise<ChicmozL1L2ValidatorHistory> => {
    const response = await client.get(
      aztecExplorer.getL1L2ValidatorHistory(address),
    );
    return validateResponse(chicmozL1L2ValidatorHistorySchema, response.data);
  },
};
