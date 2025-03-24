import asyncHandler from "express-async-handler";
import { controllers as db } from "../../../database/index.js";
import {
  getBlockByHeightOrHashSchema,
  getBlocksSchema,
} from "../paths_and_validation.js";
import { blockResponse, blockResponseArray, dbWrapper } from "./utils/index.js";
import { jsonStringify } from "@chicmoz-pkg/types";

export const openapi_GET_LATEST_HEIGHT = {
  "/l2/latest-height": {
    get: {
      summary: "Get the latest block height",
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: {
                type: "integer",
              },
            },
          },
        },
      },
    },
  },
};

export const GET_LATEST_HEIGHT = asyncHandler(async (_req, res) => {
  const latestHeight = await dbWrapper.getLatestHeight();
  res.status(200).send(jsonStringify(latestHeight));
});

export const openapi_GET_LATEST_BLOCK = {
  "/l2/blocks/latest": {
    get: {
      summary: "Get the latest block",
      responses: blockResponse,
    },
  },
};

export const GET_LATEST_BLOCK = asyncHandler(async (_req, res) => {
  const latestBlockData = await dbWrapper.getLatest(
    ["l2", "blocks"],
    db.l2Block.getLatestBlock
  );
  if (!latestBlockData) { throw new Error("Latest block not found"); }
  res.status(200).send(latestBlockData);
});

export const openapi_GET_BLOCK = {
  "/l2/blocks/{heightOrHash}": {
    get: {
      summary: "Get a block by height or hash",
      parameters: [
        {
          name: "heightOrHash",
          in: "path",
          required: true,
          schema: {
            oneOf: [
              {
                type: "string",
                pattern: "^0x[a-fA-F0-9]+$",
              },
              {
                type: "integer",
              },
            ],
          },
        },
      ],
      responses: blockResponse,
    },
  },
};

export const GET_BLOCK = asyncHandler(async (req, res) => {
  const { heightOrHash } = getBlockByHeightOrHashSchema.parse(req).params;
  const blockData = await dbWrapper.get(["l2", "blocks", heightOrHash], () =>
    db.l2Block.getBlock(heightOrHash)
  );
  res.status(200).send(blockData);
});

export const openapi_GET_BLOCKS = {
  "/l2/blocks": {
    get: {
      summary: "Get multiple blocks",
      parameters: [
        {
          name: "from",
          in: "query",
          schema: {
            type: "integer",
          },
        },
        {
          name: "to",
          in: "query",
          schema: {
            type: "integer",
          },
        },
      ],
      responses: blockResponseArray,
    },
  },
};

export const GET_BLOCKS = asyncHandler(async (req, res) => {
  const { from, to } = getBlocksSchema.parse(req).query;
  const blocksData = await dbWrapper.getLatest(["l2", "blocks", from, to], () =>
    db.l2Block.getBlocks({ from, to })
  );
  res.status(200).send(blocksData);
});
