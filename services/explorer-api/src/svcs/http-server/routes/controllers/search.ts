import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getSearchPublicLogsSchema,
  getSearchSchema,
} from "../paths_and_validation.js";
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

export const openapi_L2_SEARCH_PUBLIC_LOGS: OpenAPIObject["paths"] = {
  "/l2/search/public-logs": {
    get: {
      tags: ["L2", "search"],
      summary: "Search for transaction effects by Fr value in public logs",
      parameters: [
        {
          name: "frLogEntry",
          in: "query",
          required: true,
          schema: {
            type: "string",
            pattern: "^0x[0-9a-fA-F]+$",
          },
          description:
            "The Fr value to search for in the public logs (must start with 0x)",
        },
        {
          name: "index",
          in: "query",
          required: true,
          schema: {
            type: "integer",
            minimum: 0,
          },
          description:
            "The index position in the log array to match the Fr value",
        },
      ],
      responses: {
        "200": {
          description:
            "List of transaction hashes that contain the specified Fr value in public logs",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "string",
                  pattern: "^0x[0-9a-fA-F]+$",
                },
              },
            },
          },
        },
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/require-await
export const L2_SEARCH = asyncHandler(async (req, res) => {
  const { q } = getSearchSchema.parse(req).query;
  const searchResults = await db.l2.search(q);
  res.status(200).json(searchResults);
});

export const L2_SEARCH_PUBLIC_LOGS = asyncHandler(async (req, res) => {
  const { frLogEntry, index } = getSearchPublicLogsSchema.parse(req).query;
  const txHashes = await db.l2.searchPublicLogs({ frLogEntry, index });
  res.status(200).json(txHashes);
});
