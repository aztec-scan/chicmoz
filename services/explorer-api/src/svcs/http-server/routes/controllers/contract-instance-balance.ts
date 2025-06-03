import { generateSchema } from "@anatine/zod-openapi";
import { HexString } from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { z } from "zod";
import { 
  getLatestContractInstanceBalance,
  ContractInstanceBalanceResult 
} from "../../../database/controllers/contract-instance-balance/index.js";
import { dbWrapper } from "./utils/index.js";

const getContractInstanceBalanceSchema = z.object({
  params: z.object({
    address: z.string(),
  }),
  query: z.object({
    isPublic: z.coerce.boolean().default(true),
  }),
});

export const openapi_GET_L2_CONTRACT_INSTANCE_BALANCE: OpenAPIObject["paths"] = {
  "/l2/contract-instance/{address}/balance": {
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
      responses: {
        "200": {
          description: "Contract instance balance",
          content: {
            "application/json": {
              schema: generateSchema(
                z.object({
                  contractAddress: z.string(),
                  balance: z.string(),
                  timestamp: z.string(),
                  isPublic: z.boolean(),
                })
              ),
            },
          },
        },
        "404": {
          description: "Contract instance balance not found",
        },
      },
    },
  },
};

export const GET_L2_CONTRACT_INSTANCE_BALANCE = asyncHandler(async (req, res) => {
  const { address } = getContractInstanceBalanceSchema.parse(req).params;
  const { isPublic } = getContractInstanceBalanceSchema.parse(req).query;
  
  const balanceData = await dbWrapper.get(
    ["l2", "contract-instance", address, "balance", isPublic ? "public" : "private"],
    () => getLatestContractInstanceBalance(address as HexString)
  );

  if (!balanceData || balanceData === "null") {
    res.status(404).json({ message: "Contract instance balance not found" });
    return;
  }

  const parsedData: ContractInstanceBalanceResult = typeof balanceData === 'string' 
    ? JSON.parse(balanceData) as ContractInstanceBalanceResult
    : balanceData as ContractInstanceBalanceResult;
  
  res.status(200).json({
    contractAddress: parsedData.contractAddress,
    balance: parsedData.balance,
    timestamp: parsedData.timestamp,
    isPublic,
  });
});
