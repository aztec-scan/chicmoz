import {
  chicmozL1FeeJuicePortalDepositSchema,
  type ChicmozL1FeeJuicePortalDeposit,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const L1FeeJuicePortalDepositAPI = {
  getByAddress: async (
    address: string,
  ): Promise<ChicmozL1FeeJuicePortalDeposit[]> => {
    const response = await client.get(
      aztecExplorer.getL1FeeJuicePortalDepositsByAddress(address),
    );
    return validateResponse(
      z.array(chicmozL1FeeJuicePortalDepositSchema),
      response.data,
    );
  },
};
