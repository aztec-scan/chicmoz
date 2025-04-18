import {
  chicmozL2PendingTxSchema,
  type ChicmozL2PendingTx,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const TxAPI = {
  getPendingTxs: async (): Promise<ChicmozL2PendingTx[]> => {
    const response = await client.get(aztecExplorer.getL2PendingTxs);
    return validateResponse(z.array(chicmozL2PendingTxSchema), response.data);
  },
  getPendingTxsByHash: async (hash: string): Promise<ChicmozL2PendingTx> => {
    const response = await client.get(
      aztecExplorer.getL2PendingTxsByHash(hash),
    );
    return validateResponse(chicmozL2PendingTxSchema, response.data);
  },
};
