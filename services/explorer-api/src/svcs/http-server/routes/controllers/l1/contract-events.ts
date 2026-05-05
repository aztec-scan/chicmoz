import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../../database/index.js";
import { getL1ContractEventsHourlyCountsSchema } from "../../paths_and_validation.js";
import { contractEventsResponse, dbWrapper } from "../utils/index.js";

export const openapi_GET_L1_CONTRACT_EVENTS: OpenAPIObject["paths"] = {
  "/l1/contract-events": {
    get: {
      tags: ["L1", "contract-events"],
      summary: "Get L1 contract events",
      parameters: [],
      responses: contractEventsResponse,
    },
  },
};

export const GET_L1_CONTRACT_EVENTS = asyncHandler(async (_req, res) => {
  const contractEventsData = await dbWrapper.getLatest(
    ["l1", "contract-events"],
    () => db.l1.contractEvents.get(),
  );
  res.status(200).json(JSON.parse(contractEventsData));
});

export const openapi_GET_L1_CONTRACT_EVENTS_HOURLY_COUNTS: OpenAPIObject["paths"] =
  {
    "/l1/contract-events/hourly-counts": {
      get: {
        tags: ["L1", "contract-events"],
        summary: "Per-hour L1 contract event counts over a rolling window",
        parameters: [
          {
            name: "hours",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 168, default: 24 },
            description: "Window in hours (1–168). Defaults to 24.",
          },
        ],
        responses: {
          "200": {
            description:
              "Sparse list of buckets — empty hours are omitted, callers fill in zeros.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["hourStartMs", "count"],
                    properties: {
                      hourStartMs: { type: "integer" },
                      count: { type: "integer" },
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

export const GET_L1_CONTRACT_EVENTS_HOURLY_COUNTS = asyncHandler(
  async (req, res) => {
    const { hours } = getL1ContractEventsHourlyCountsSchema.parse(req).query;
    const data = await dbWrapper.getLatest(
      ["l1", "contract-events", "hourly-counts", String(hours)],
      () => db.l1.contractEvents.getHourlyCounts(hours),
    );
    res.status(200).json(JSON.parse(data));
  },
);
