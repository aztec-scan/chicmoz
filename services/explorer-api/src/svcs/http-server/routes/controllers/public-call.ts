import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getPublicCallRequessByAddressSchema,
  getTxEffectsByTxHashSchema,
} from "../paths_and_validation.js";
import { dbWrapper } from "./utils/index.js";

export const openapi_GET_PUBLIC_CALL_REQUESTS_BY_TX_HASH: OpenAPIObject["paths"] =
  {
    "/l2/public-call-requests/tx/{hash}": {
      get: {
        tags: ["L2", "pending-txs", "public-call-requests"],
        summary: "Get public call requests by tx hash",
        parameters: [
          {
            name: "hash",
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
                  items: {
                    type: "object",
                    properties: {
                      msgSender: { type: "string" },
                      contractAddress: { type: "string" },
                      isStaticCall: { type: "boolean" },
                      calldataHash: { type: "string" },
                    },
                  },
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

export const openapi_GET_PUBLIC_CALL_REQUESTS_BY_CONTRACT_ADDRESS: OpenAPIObject["paths"] =
  {
    "/l2/public-call-requests/contract/{address}": {
      get: {
        tags: ["L2", "public-call-requests"],
        summary: "Get public call requests by contract address",
        parameters: [
          {
            name: "address",
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
            description: "Public call requests for the contract address",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      msgSender: { type: "string" },
                      contractAddress: { type: "string" },
                      isStaticCall: { type: "boolean" },
                      calldataHash: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

export const GET_PUBLIC_CALL_REQUESTS_BY_CONTRACT_ADDRESS = asyncHandler(
  async (req, res) => {
    const { address } = getPublicCallRequessByAddressSchema.parse(req).params;
    const publicCallRequests = await dbWrapper.getLatest(
      ["l2", "public-call-requests", "contract", address],
      () => db.l2PublicCall.getPublicCallRequestsByContractAddress(address),
    );
    res.status(200).json(JSON.parse(publicCallRequests));
  },
);

export const openapi_GET_PUBLIC_CALL_REQUESTS_BY_SENDER_ADDRESS: OpenAPIObject["paths"] =
  {
    "/l2/public-call-requests/sender/{address}": {
      get: {
        tags: ["L2", "public-call-requests"],
        summary: "Get public call requests by sender address",
        parameters: [
          {
            name: "address",
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
            description: "Public call requests for the sender address",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      msgSender: { type: "string" },
                      contractAddress: { type: "string" },
                      isStaticCall: { type: "boolean" },
                      calldataHash: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

export const GET_PUBLIC_CALL_REQUESTS_BY_SENDER_ADDRESS = asyncHandler(
  async (req, res) => {
    const { address } = getPublicCallRequessByAddressSchema.parse(req).params;
    const publicCallRequests = await dbWrapper.getLatest(
      ["l2", "public-call-requests", "sender", address],
      () => db.l2PublicCall.getPublicCallRequestsBySenderAddress(address),
    );
    res.status(200).json(JSON.parse(publicCallRequests));
  },
);
