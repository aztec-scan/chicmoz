import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import {
  getLatestContractInstanceBalance,
  getCotractInstacesWithBalance,
  getContractInstanceBalanceHistory,
} from "../../../database/controllers/contract-instance-balance/index.js";
import { getContractInstanceBalanceSchema } from "../paths_and_validation.js";
import {
  contractInstanceBalanceHistoryResponse,
  contractInstanceBalanceResponse,
  contractInstanceWithBalanceResponse,
  dbWrapper,
} from "./utils/index.js";

export const openapi_GET_L2_CONTRACT_INSTANCE_BALANCE: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/{address}/balance": {
      get: {
        tags: ["L2", "contract-instances"],
        summary: "Get contract instance balance by address",
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
          {
            name: "isPublic",
            in: "query",
            schema: {
              type: "boolean",
              default: true,
            },
          },
        ],
        responses: contractInstanceBalanceResponse,
      },
    },
  };

export const openapi_GET_L2_CONTRACT_INSTANCES_WITH_BALANCE: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/with-balance": {
      get: {
        tags: ["L2", "contract-instances"],
        summary: "Get all contract instances with balance",
        responses: contractInstanceWithBalanceResponse,
      },
    },
  };

export const openapi_GET_L2_CONTRACT_INSTANCE_BALANCE_HISTORY: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/{address}/balance/history": {
      get: {
        tags: ["L2", "contract-instances"],
        summary:
          "Get contract instance balance history by address (limited to 1000 most recent entries)",
        description:
          "Returns the balance history for a contract instance, ordered chronologically by timestamp. Results are limited to the 1000 most recent entries for performance optimization.",
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
        responses: contractInstanceBalanceHistoryResponse,
      },
    },
  };

export const GET_L2_CONTRACT_INSTANCE_BALANCE = asyncHandler(
  async (req, res) => {
    const {
      params: { address },
    } = getContractInstanceBalanceSchema.parse(req);

    const balanceData = await dbWrapper.get(
      ["l2", "contract-instance", address, "balance"],
      () => getLatestContractInstanceBalance(address),
    );
    res.status(200).json(JSON.parse(balanceData));
  },
);

export const GET_L2_CONTRACT_INSTANCES_WITH_BALANCE = asyncHandler(
  async (req, res) => {
    const balanceData = await dbWrapper.get(
      ["l2", "contract-instances", "with-balance"],
      () => getCotractInstacesWithBalance(),
    );
    res.status(200).json(JSON.parse(balanceData));
  },
);

export const GET_L2_CONTRACT_INSTANCE_BALANCE_HISTORY = asyncHandler(
  async (req, res) => {
    const {
      params: { address },
    } = getContractInstanceBalanceSchema.parse(req);

    const balanceData = await dbWrapper.get(
      ["l2", "contract-instance", address, "balance", "history"],
      () => getContractInstanceBalanceHistory(address),
    );
    res.status(200).json(JSON.parse(balanceData));
  },
);
