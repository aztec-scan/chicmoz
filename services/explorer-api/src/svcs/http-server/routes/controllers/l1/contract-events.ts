import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../../database/index.js";
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
