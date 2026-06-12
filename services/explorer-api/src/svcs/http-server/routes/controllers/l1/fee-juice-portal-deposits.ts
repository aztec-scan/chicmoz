import asyncHandler from "express-async-handler";
import { type OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../../database/index.js";
import { getFeeJuicePortalDepositsByAddressSchema } from "../../paths_and_validation.js";
import { dbWrapper } from "../utils/index.js";

const feeJuiceDepositSchema = {
  type: "object",
  properties: {
    l1BlockNumber: { type: "string" },
    l1BlockHash: { type: "string" },
    l1BlockTimestamp: { type: "number" },
    l1ContractAddress: { type: "string" },
    l1TransactionHash: { type: "string" },
    l1LogIndex: { type: "number" },
    isFinalized: { type: "boolean" },
    l1Sender: { type: "string", description: "L1 address of the depositor (msg.sender on portal tx)" },
    to: { type: "string", description: "L2 recipient address (bytes32/Fr hex)" },
    amount: { type: "string", description: "Fee juice amount in wei (bigint as string)" },
    secretHash: { type: "string" },
    key: { type: "string", description: "Inbox message key (bytes32)" },
    index: { type: "string", description: "Inbox leaf index (bigint as string)" },
  },
};

export const openapi_GET_L1_FEE_JUICE_PORTAL_DEPOSITS_BY_ADDRESS: OpenAPIObject["paths"] =
  {
    "/l1/fee-juice-portal-deposits/{address}": {
      get: {
        tags: ["L1", "fee-juice"],
        summary:
          "Get L1→L2 fee juice deposits for an L2 address (FeeJuicePortal.DepositToAztecPublic)",
        parameters: [
          {
            name: "address",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
            description: "L2 recipient address (bytes32 / Fr hex)",
          },
        ],
        responses: {
          200: {
            description: "Fee juice deposits targeting this L2 address",
            content: {
              "application/json": {
                schema: { type: "array", items: feeJuiceDepositSchema },
              },
            },
          },
        },
      },
    },
  };

export const GET_L1_FEE_JUICE_PORTAL_DEPOSITS_BY_ADDRESS = asyncHandler(
  async (req, res) => {
    const { address } =
      getFeeJuicePortalDepositsByAddressSchema.parse(req).params;
    const data = await dbWrapper.getLatest(
      ["l1", "fee-juice-portal-deposits", address],
      () => db.l1.feeJuicePortalDeposits.getByL2Address(address),
    );
    res.status(200).json(JSON.parse(data));
  },
);
