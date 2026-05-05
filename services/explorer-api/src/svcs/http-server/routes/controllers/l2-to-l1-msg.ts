import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getL2ToL1MsgsByAddressSchema,
  getTxEffectsByTxHashSchema,
} from "../paths_and_validation.js";
import { dbWrapper } from "./utils/index.js";

const l2ToL1MsgSchema = {
  type: "object",
  properties: {
    txHash: { type: "string" },
    index: { type: "number" },
    contractAddress: { type: "string" },
    recipient: { type: "string" },
    content: { type: "string" },
  },
};

export const openapi_GET_L2_TO_L1_MSGS_BY_TX_HASH: OpenAPIObject["paths"] = {
  "/l2/l2-to-l1-msgs/tx/{hash}": {
    get: {
      tags: ["L2", "pending-txs", "l2-to-l1-msgs"],
      summary: "Get L2-to-L1 messages by tx hash",
      parameters: [
        {
          name: "hash",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
        },
      ],
      responses: {
        200: {
          description: "L2-to-L1 messages for the transaction",
          content: {
            "application/json": {
              schema: { type: "array", items: l2ToL1MsgSchema },
            },
          },
        },
      },
    },
  },
};

export const GET_L2_TO_L1_MSGS_BY_TX_HASH = asyncHandler(async (req, res) => {
  const { txEffectHash } = getTxEffectsByTxHashSchema.parse(req).params;
  const msgs = await dbWrapper.getLatest(
    ["l2", "l2-to-l1-msgs", "tx", txEffectHash],
    () => db.l2PendingL2ToL1Msg.getL2ToL1MsgsByTxHash(txEffectHash),
  );
  res.status(200).json(JSON.parse(msgs));
});

export const openapi_GET_L2_TO_L1_MSGS_BY_CONTRACT_ADDRESS: OpenAPIObject["paths"] =
  {
    "/l2/l2-to-l1-msgs/contract/{address}": {
      get: {
        tags: ["L2", "l2-to-l1-msgs"],
        summary: "Get L2-to-L1 messages by emitting contract address",
        parameters: [
          {
            name: "address",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
          },
        ],
        responses: {
          200: {
            description: "L2-to-L1 messages emitted by the contract",
            content: {
              "application/json": {
                schema: { type: "array", items: l2ToL1MsgSchema },
              },
            },
          },
        },
      },
    },
  };

export const GET_L2_TO_L1_MSGS_BY_CONTRACT_ADDRESS = asyncHandler(
  async (req, res) => {
    const { address } = getL2ToL1MsgsByAddressSchema.parse(req).params;
    const msgs = await dbWrapper.getLatest(
      ["l2", "l2-to-l1-msgs", "contract", address],
      () => db.l2PendingL2ToL1Msg.getL2ToL1MsgsByContractAddress(address),
    );
    res.status(200).json(JSON.parse(msgs));
  },
);

export const openapi_GET_L2_TO_L1_MSGS_BY_RECIPIENT: OpenAPIObject["paths"] = {
  "/l2/l2-to-l1-msgs/recipient/{address}": {
    get: {
      tags: ["L2", "l2-to-l1-msgs"],
      summary: "Get L2-to-L1 messages by L1 recipient address",
      parameters: [
        {
          name: "address",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
        },
      ],
      responses: {
        200: {
          description: "L2-to-L1 messages for the L1 recipient",
          content: {
            "application/json": {
              schema: { type: "array", items: l2ToL1MsgSchema },
            },
          },
        },
      },
    },
  },
};

export const GET_L2_TO_L1_MSGS_BY_RECIPIENT = asyncHandler(async (req, res) => {
  const { address } = getL2ToL1MsgsByAddressSchema.parse(req).params;
  const msgs = await dbWrapper.getLatest(
    ["l2", "l2-to-l1-msgs", "recipient", address],
    () => db.l2PendingL2ToL1Msg.getL2ToL1MsgsByRecipient(address),
  );
  res.status(200).json(JSON.parse(msgs));
});
