import {
  chicmozL2DroppedTxSchema,
  type ChicmozL2DroppedTx,
} from "@chicmoz-pkg/types";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const DroppedTxAPI = {
  getDroppedTxByHash: async (hash: string): Promise<ChicmozL2DroppedTx | null> => {
    try {
      const response = await client.get(
        aztecExplorer.getL2DroppedTxByHash(hash)
      );
      return validateResponse(chicmozL2DroppedTxSchema, response.data);
    } catch (error) {
      // Return null if the transaction is not found (404) or any other error
      return null;
    }
  },
};
