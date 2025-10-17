import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getL1L2ValidatorSchema,
  getL1L2ValidatorsPaginatedSchema,
} from "../paths_and_validation.js";
import {
  dbWrapper,
  l1L2ValidatorHistoryResponse,
  l1L2ValidatorResponse,
  l1L2ValidatorResponseArray,
} from "./utils/index.js";

export const openapi_GET_L1_L2_VALIDATORS: OpenAPIObject["paths"] = {
  "/l1/l2-validators": {
    get: {
      tags: ["L1", "l2-validators"],
      summary: "Get L1 and L2 validators",
      parameters: [
        {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        {
          name: "offset",
          in: "query",
          schema: {
            type: "integer",
            minimum: 0,
            default: 0,
          },
        },
      ],
      responses: l1L2ValidatorResponseArray,
    },
  },
};

export const GET_L1_L2_VALIDATORS = asyncHandler(async (req, res) => {
  const { limit, offset } = getL1L2ValidatorsPaginatedSchema.parse(req).query;
  const validators = await dbWrapper.get(
    ["l1", "l2-validators", limit, offset],
    () => db.l1.getAllL1L2Validators(undefined, { limit, offset }),
  );
  if (!validators) {
    throw new Error("Validators not found");
  }
  res.status(200).json(JSON.parse(validators));
});

export const openapi_GET_L1_L2_VALIDATOR: OpenAPIObject["paths"] = {
  "/l1/l2-validators/:attesterAddress": {
    get: {
      tags: ["L1", "l2-validators"],
      summary: "Get L1L2Validator",
      parameters: [
        {
          name: "attesterAddress",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "hex",
          },
        },
      ],
      responses: l1L2ValidatorResponse,
    },
  },
};

export const GET_L1_L2_VALIDATOR = asyncHandler(async (req, res) => {
  const { attesterAddress } = getL1L2ValidatorSchema.parse(req).params;
  const validator = await dbWrapper.get(
    ["l1", "l2-validators", attesterAddress],
    () => db.l1.getL1L2Validator(attesterAddress),
  );
  res.status(200).json(JSON.parse(validator));
});

export const openapi_GET_L1_L2_VALIDATOR_HISTORY: OpenAPIObject["paths"] = {
  "/l1/l2-validators/:attesterAddress/history": {
    get: {
      tags: ["L1", "l2-validators"],
      summary: "Get L1L2Validator history",
      parameters: [
        {
          name: "attesterAddress",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "hex",
          },
        },
      ],
      responses: l1L2ValidatorHistoryResponse,
    },
  },
};

export const GET_L1_L2_VALIDATOR_HISTORY = asyncHandler(async (req, res) => {
  const { attesterAddress } = getL1L2ValidatorSchema.parse(req).params;
  const history = await dbWrapper.get(
    ["l1", "l2-validators", attesterAddress, "history"],
    () => db.l1.getL1L2ValidatorHistory(attesterAddress),
  );
  res.status(200).json(JSON.parse(history));
});

export const openapi_GET_L1_L2_VALIDATOR_TOTALS: OpenAPIObject["paths"] = {
  "/l1/l2-validators/totals": {
    get: {
      tags: ["L1", "l2-validators"],
      summary: "Get validator totals by status",
      responses: {
        "200": {
          description: "Validator totals",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  validating: { type: "integer" },
                  nonValidating: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const GET_L1_L2_VALIDATOR_TOTALS = asyncHandler(async (_req, res) => {
  const totals = await dbWrapper.get(["l1", "l2-validators", "totals"], () =>
    db.l1.getValidatorTotals(),
  );
  res.status(200).json(JSON.parse(totals));
});
