import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import { getSearchSchema } from "../paths_and_validation.js";
import { searchResultResponse } from "./utils/index.js";

export const openapi_L2_SEARCH: OpenAPIObject["paths"] = {
  "/l2/search": {
    get: {
      tags: ["L2", "search"],
      summary:
        "Search for blocks, txEffects, contract classes and contract instances on Aztec",
      parameters: [
        {
          name: "q",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: searchResultResponse,
    },
  },
};

// eslint-disable-next-line @typescript-eslint/require-await
export const L2_SEARCH = asyncHandler(async (req, res) => {
  const { q } = getSearchSchema.parse(req).query;
  const searchResults = await db.l2.search(q);
  res.status(200).json(searchResults);
});
