import {
  type ChicmozL2DroppedTx,
  chicmozL2DroppedTxSchema,
} from "@chicmoz-pkg/types";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const DroppedTxAPI = {
  getDroppedTxByHash: async (hash: string): Promise<ChicmozL2DroppedTx> => {
    const response = await client.get(
      aztecExplorer.getL2DroppedTxByHash(hash),
    );
    return validateResponse(chicmozL2DroppedTxSchema, response.data);
  },
};
