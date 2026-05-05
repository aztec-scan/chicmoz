import {
  type ChicmozChainInfo,
  type ChicmozL2RpcNodeError,
  chicmozChainInfoSchema,
  chicmozL2RpcNodeErrorSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const ChainInfoAPI = {
  getChainInfo: async (): Promise<ChicmozChainInfo> => {
    const response = await client.get(aztecExplorer.getL2ChainInfo);
    return validateResponse(chicmozChainInfoSchema, response.data);
  },
  getChainErrors: async (): Promise<ChicmozL2RpcNodeError[]> => {
    const response = await client.get(aztecExplorer.getL2ChainErrors);
    return validateResponse(
      z.array(chicmozL2RpcNodeErrorSchema),
      response.data,
    );
  },
};
