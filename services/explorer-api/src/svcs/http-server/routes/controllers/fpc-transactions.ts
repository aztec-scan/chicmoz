import asyncHandler from "express-async-handler";
import { jsonStringify } from "@chicmoz-pkg/types";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { getFpcTransactions } from "../../../database/controllers/l2TxEffect/index.js";
import { getContractInstanceFpcRelationshipsSchema } from "../paths_and_validation.js";

export const openapi_GET_L2_CONTRACT_INSTANCE_FPC_TRANSACTIONS: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/{address}/fpc-transactions": {
      get: {
        tags: ["L2", "contract-instances"],
        summary:
          "Get FPC-related transactions for an address",
        description:
          "Returns transactions where this address paid fees for others (asFeePayer) and where others paid fees for this address (asSponsored).",
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
          "200": {
            description: "FPC transactions for the address",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    asFeePayer: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          txHash: { type: "string" },
                          feePayer: { type: "string" },
                          sponsoredAddress: { type: "string" },
                          transactionFee: { type: "string" },
                          blockHeight: { type: "integer" },
                          timestamp: { type: "integer" },
                        },
                      },
                    },
                    asSponsored: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          txHash: { type: "string" },
                          feePayer: { type: "string" },
                          sponsoredAddress: { type: "string" },
                          transactionFee: { type: "string" },
                          blockHeight: { type: "integer" },
                          timestamp: { type: "integer" },
                        },
                      },
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

export const GET_L2_CONTRACT_INSTANCE_FPC_TRANSACTIONS = asyncHandler(
  async (req, res) => {
    const {
      params: { address },
    } = getContractInstanceFpcRelationshipsSchema.parse(req);

    const data = await getFpcTransactions(address);
    res.status(200).json(JSON.parse(jsonStringify(data)));
  },
);
