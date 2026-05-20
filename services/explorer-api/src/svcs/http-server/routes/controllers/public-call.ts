import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getPublicCallRequestsSchema,
  getTxEffectsByTxHashSchema,
} from "../paths_and_validation.js";
import { dbWrapper } from "./utils/index.js";

const publicCallRequestSchema = {
  type: "object",
  properties: {
    txHash: { type: "string" },
    msgSender: { type: "string" },
    contractAddress: { type: "string" },
    isStaticCall: { type: "boolean" },
    calldataHash: { type: "string" },
    callType: {
      type: "string",
      enum: ["non_revertible", "revertible", "teardown"],
    },
    functionSelector: { type: "string", nullable: true },
    contractName: { type: "string", nullable: true },
    functionName: { type: "string", nullable: true },
  },
};

export const openapi_GET_PUBLIC_CALL_REQUESTS_BY_TX_HASH: OpenAPIObject["paths"] =
  {
    "/l2/public-call-requests/{txHash}": {
      get: {
        tags: ["L2", "pending-txs", "public-call-requests"],
        summary: "Get public call requests by tx hash",
        parameters: [
          {
            name: "txHash",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[a-fA-F0-9]+$",
            },
          },
        ],
        responses: {
          200: {
            description: "Public call requests for the transaction",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: publicCallRequestSchema,
                },
              },
            },
          },
        },
      },
    },
  };

export const GET_PUBLIC_CALL_REQUESTS_BY_TX_HASH = asyncHandler(
  async (req, res) => {
    const { txEffectHash } = getTxEffectsByTxHashSchema.parse(req).params;
    const publicCallRequests = await dbWrapper.getLatest(
      ["l2", "txs", txEffectHash, "public-call-requests"],
      () => db.l2PublicCall.getPublicCallRequestsByTxHash(txEffectHash),
    );
    res.status(200).json(JSON.parse(publicCallRequests));
  },
);

export const openapi_GET_PUBLIC_CALL_REQUESTS: OpenAPIObject["paths"] = {
  "/l2/public-call-requests": {
    get: {
      tags: ["L2", "public-call-requests"],
      summary:
        "Get public call requests filtered by contractAddress or senderAddress query param",
      parameters: [
        {
          name: "contractAddress",
          in: "query",
          required: false,
          schema: {
            type: "string",
            pattern: "^0x[a-fA-F0-9]+$",
          },
        },
        {
          name: "senderAddress",
          in: "query",
          required: false,
          schema: {
            type: "string",
            pattern: "^0x[a-fA-F0-9]+$",
          },
        },
      ],
      responses: {
        200: {
          description: "Public call requests matching the given filter",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: publicCallRequestSchema,
              },
            },
          },
        },
        400: {
          description:
            "Bad request — provide exactly one of contractAddress or senderAddress (not both, not neither)",
        },
      },
    },
  },
};

export const GET_PUBLIC_CALL_REQUESTS = asyncHandler(async (req, res) => {
  const { contractAddress, senderAddress } =
    getPublicCallRequestsSchema.parse(req).query;

  if (contractAddress && senderAddress) {
    res
      .status(400)
      .json({ error: "Provide either contractAddress or senderAddress, not both" });
    return;
  }

  if (contractAddress) {
    const publicCallRequests = await dbWrapper.getLatest(
      ["l2", "public-call-requests", "contract", contractAddress],
      () =>
        db.l2PublicCall.getPublicCallRequestsByContractAddress(contractAddress),
    );
    res.status(200).json(JSON.parse(publicCallRequests));
    return;
  }

  if (senderAddress) {
    const publicCallRequests = await dbWrapper.getLatest(
      ["l2", "public-call-requests", "sender", senderAddress],
      () =>
        db.l2PublicCall.getPublicCallRequestsBySenderAddress(senderAddress),
    );
    res.status(200).json(JSON.parse(publicCallRequests));
    return;
  }

  res
    .status(400)
    .json({ error: "Provide either contractAddress or senderAddress" });
});

