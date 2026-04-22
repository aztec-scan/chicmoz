import {
  type PublicChicmozL2RpcNode,
  type PublicChicmozL2RpcNodeDeluxe,
  publicChicmozL2RpcNodeDeluxeSchema,
  publicChicmozL2RpcNodeSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const RpcNodeAPI = {
  getAllRpcNodes: async (): Promise<PublicChicmozL2RpcNode[]> => {
    const response = await client.get(aztecExplorer.getL2RpcNodes);
    return validateResponse(
      z.array(publicChicmozL2RpcNodeSchema),
      response.data,
    );
  },
  getRpcNodeByName: async (
    rpcNodeName: string,
  ): Promise<PublicChicmozL2RpcNodeDeluxe> => {
    const response = await client.get(aztecExplorer.getL2RpcNode(rpcNodeName));
    return validateResponse(publicChicmozL2RpcNodeDeluxeSchema, response.data);
  },
};
