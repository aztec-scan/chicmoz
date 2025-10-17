import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getL1L2ValidatorSchema,
  getL1L2ValidatorsSchema,
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
      summary: "Get L1 and L2 validators with sentinel stats",
      parameters: [
        {
          name: "order",
          in: "query",
          required: false,
          schema: {
            type: "string",
            description:
              "Order ascending or descending by how many slots or slot recency",
          },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 500,
          },
        },
        {
          name: "offset",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 0,
          },
        },
      ],
      responses: l1L2ValidatorResponseArray,
    },
  },
};

export const GET_L1_L2_VALIDATORS = asyncHandler(async (req, res) => {
  const { query } = getL1L2ValidatorsSchema.parse(req);
  const { order, limit, offset } = query ?? {};

  const cacheKeys = [
    "l1",
    "l2-validators",
    order !== undefined ? `order:${order}` : "order:any",
    limit !== undefined ? `limit:${limit}` : "limit:default",
    offset !== undefined ? `offset:${offset}` : "offset:0",
  ];

  const validators = await dbWrapper.getLatest(cacheKeys, () =>
    db.validator.getValidatorsWithSentinel({
      order: order,
      limit,
      offset,
    }),
  );

  res.status(200).json(JSON.parse(validators));
});

export const openapi_GET_L1_L2_VALIDATOR: OpenAPIObject["paths"] = {
  "/l1/l2-validators/:attesterAddress": {
    get: {
      tags: ["L1", "l2-validators"],
      summary: "Get single validator merged with sentinel stats",
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
        {
          name: "includeHistory",
          in: "query",
          required: false,
          schema: {
            type: "boolean",
          },
        },
        {
          name: "historyLimit",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 500,
          },
        },
        {
          name: "historyOffset",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 0,
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
    () => db.validator.getValidatorWithSentinel(attesterAddress),
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
