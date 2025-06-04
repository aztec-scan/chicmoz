import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { getLatestContractInstanceBalance } from "../../../database/controllers/contract-instance-balance/index.js";
import { getContractInstanceBalanceSchema } from "../paths_and_validation.js";
import { contractInstanceBalanceResponse, dbWrapper } from "./utils/index.js";

export const openapi_GET_L2_CONTRACT_INSTANCE_BALANCE: OpenAPIObject["paths"] =
  {
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
        responses: contractInstanceBalanceResponse,
      },
    },
  };

export const GET_L2_CONTRACT_INSTANCE_BALANCE = asyncHandler(
  async (req, res) => {
    const {
      params: { address },
      query: { isPublic },
    } = getContractInstanceBalanceSchema.parse(req);

    const balanceData = await dbWrapper.get(
      [
        "l2",
        "contract-instance",
        address,
        "balance",
        isPublic ? "public" : "private",
      ],
      () => getLatestContractInstanceBalance(address),
    );
    res.status(200).json(JSON.parse(balanceData));
  },
);
