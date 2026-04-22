import {
  jsonStringify,
  publicChicmozL2RpcNodeDeluxeSchema,
  publicChicmozL2RpcNodeSchema,
} from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { z } from "zod";
import { controllers as db } from "../../../database/index.js";
import { getRpcNodeSchema } from "../paths_and_validation.js";
import {
  dbWrapper,
  rpcNodeResponse,
  rpcNodeResponseArray,
} from "./utils/index.js";

export const openapi_GET_L2_RPC_NODES: OpenAPIObject["paths"] = {
  "/l2/rpc-nodes": {
    get: {
      tags: ["L2", "rpc-nodes"],
      summary: "Get all L2 rpc nodes",
      responses: rpcNodeResponseArray,
    },
  },
};

export const GET_L2_RPC_NODES = asyncHandler(async (_req, res) => {
  const rpcNodes = await dbWrapper.getLatest(
    ["l2", "rpc-nodes"],
    db.l2.getAllRpcNodes,
  );
  if (!rpcNodes) {
    throw new Error("RPC nodes not found");
  }
  const validatedRpcNodes = z
    .array(publicChicmozL2RpcNodeSchema)
    .parse(JSON.parse(rpcNodes));
  res
    .status(200)
    .type("application/json")
    .send(jsonStringify(validatedRpcNodes));
});

export const openapi_GET_L2_RPC_NODE: OpenAPIObject["paths"] = {
  "/l2/rpc-nodes/:rpcNodeName": {
    get: {
      tags: ["L2", "rpc-nodes"],
      summary: "Get L2 rpc node by name",
      parameters: [
        {
          name: "rpcNodeName",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: rpcNodeResponse,
    },
  },
};

export const GET_L2_RPC_NODE = asyncHandler(async (req, res) => {
  const { rpcNodeName } = getRpcNodeSchema.parse(req).params;
  const rpcNode = await dbWrapper.getLatest(
    ["l2", "rpc-nodes", rpcNodeName],
    () => db.l2.getL2RpcNodeByName(rpcNodeName),
  );
  const validatedRpcNode = publicChicmozL2RpcNodeDeluxeSchema.parse(
    JSON.parse(rpcNode),
  );
  res
    .status(200)
    .type("application/json")
    .send(jsonStringify(validatedRpcNode));
});
