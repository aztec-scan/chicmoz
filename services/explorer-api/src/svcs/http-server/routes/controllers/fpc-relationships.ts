import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import {
  getFeePayersForAddress,
  getSponsoredAddressesForFpc,
} from "../../../database/controllers/l2TxEffect/index.js";
import { getContractInstanceFpcRelationshipsSchema } from "../paths_and_validation.js";

export const openapi_GET_L2_CONTRACT_INSTANCE_FPC_RELATIONSHIPS: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/{address}/fpc-relationships": {
      get: {
        tags: ["L2", "contract-instances"],
        summary:
          "Get Fee Paying Contract (FPC) relationships for an address",
        description:
          "Returns which FPCs pay fees for this address, and (if the address is itself an FPC) which addresses it sponsors.",
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
            description: "FPC relationships for the address",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    feePayers: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "FPC addresses that pay fees for this address",
                    },
                    sponsoredAddresses: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Addresses for which this FPC pays fees (only populated when the address is an FPC)",
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

export const GET_L2_CONTRACT_INSTANCE_FPC_RELATIONSHIPS = asyncHandler(
  async (req, res) => {
    const {
      params: { address },
    } = getContractInstanceFpcRelationshipsSchema.parse(req);

    // Bypass dbWrapper.get() — it double-stringifies the JSON response.
    const [feePayers, sponsoredAddresses] = await Promise.all([
      getFeePayersForAddress(address),
      getSponsoredAddressesForFpc(address),
    ]);
    res.status(200).json({ feePayers, sponsoredAddresses });
  },
);
