import {
  type ChicmozL2RpcNode,
  chicmozL2RpcNodeSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const RpcNodeAPI = {
  getAllRpcNodes: async (): Promise<ChicmozL2RpcNode[]> => {
    const response = await client.get(aztecExplorer.getL2RpcNodes);
    return validateResponse(z.array(chicmozL2RpcNodeSchema), response.data);
  },
  getRpcNodeByName: async (rpcNodeName: string): Promise<ChicmozL2RpcNode> => {
    const response = await client.get(aztecExplorer.getL2RpcNode(rpcNodeName));
    return validateResponse(chicmozL2RpcNodeSchema, response.data);
  },
};
