import {
  type ChicmozFeeRecipient,
  chicmozFeeRecipientSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const FeeRecipientAPI = {
  getFeeRecipients: async (): Promise<ChicmozFeeRecipient[]> => {
    const response = await client.get(aztecExplorer.getL2FeeRecipients);
    return validateResponse(z.array(chicmozFeeRecipientSchema), response.data);
  },
};
