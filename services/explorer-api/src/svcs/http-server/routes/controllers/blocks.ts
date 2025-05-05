import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getBlockByHeightOrHashSchema,
  getBlocksSchema,
} from "../paths_and_validation.js";
import {
  blockResponse,
  blockResponseArray,
  dbWrapper,
  reorgResponseArray,
} from "./utils/index.js";

export const openapi_GET_LATEST_HEIGHT: OpenAPIObject["paths"] = {
  "/l2/latest-height": {
    get: {
      tags: ["L2", "blocks"],
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
  res.status(200).json(JSON.parse(latestHeight.toString()));
});

export const openapi_GET_LATEST_BLOCK: OpenAPIObject["paths"] = {
  "/l2/blocks/latest": {
    get: {
      tags: ["L2", "blocks"],
      summary: "Get the latest block",
      responses: blockResponse,
    },
  },
};

export const GET_LATEST_BLOCK = asyncHandler(async (_req, res) => {
  const latestBlockData = await dbWrapper.getLatest(
    ["l2", "blocks"],
    db.l2Block.getLatestBlock,
  );
  res.status(200).json(JSON.parse(latestBlockData));
});

export const openapi_GET_BLOCK: OpenAPIObject["paths"] = {
  "/l2/blocks/{heightOrHash}": {
    get: {
      tags: ["L2", "blocks"],
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
    db.l2Block.getBlock(heightOrHash),
  );
  res.status(200).json(JSON.parse(blockData));
});

export const openapi_GET_BLOCKS: OpenAPIObject["paths"] = {
  "/l2/blocks": {
    get: {
      tags: ["L2", "blocks"],
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
    db.l2Block.getBlocks({ from, to }),
  );
  res.status(200).json(JSON.parse(blocksData));
});

export const openapi_GET_BLOCKS_BY_FINALIZATION_STATUS: OpenAPIObject["paths"] =
  {
    "/l2/blocks/by-status": {
      get: {
        tags: ["L2", "blocks"],
        summary: "Get one block for each finalization status",
        responses: blockResponseArray,
      },
    },
  };

export const GET_BLOCKS_BY_FINALIZATION_STATUS = asyncHandler(
  async (_req, res) => {
    const blocksData = await dbWrapper.getLatest(
      ["l2", "blocks", "by-status"],
      () => db.l2Block.getBlocksByFinalizationStatus(),
    );
    res.status(200).json(JSON.parse(blocksData));
  },
);

export const openapi_GET_ORPHANED_BLOCKS: OpenAPIObject["paths"] = {
  "/l2/blocks/orphaned": {
    get: {
      tags: ["L2", "blocks"],
      summary: "Get all orphaned blocks",
      responses: blockResponseArray,
    },
  },
};

export const GET_ORPHANED_BLOCKS = asyncHandler(async (_req, res) => {
  const orphanedBlocksData = await dbWrapper.getLatest(
    ["l2", "blocks", "orphaned"],
    () => db.l2Block.getOrphanedBlocks(),
  );
  res.status(200).json(JSON.parse(orphanedBlocksData));
});

export const openapi_GET_REORGS: OpenAPIObject["paths"] = {
  "/l2/reorgs": {
    get: {
      tags: ["L2", "blocks"],
      summary: "Get information about chain reorganizations",
      responses: reorgResponseArray,
    },
  },
};

export const GET_REORGS = asyncHandler(async (_req, res) => {
  const reorgsData = await dbWrapper.getLatest(["l2", "reorgs"], () =>
    db.l2Block.getReorgs(),
  );
  res.status(200).json(JSON.parse(reorgsData));
});

export const openapi_GET_ORPHANED_BLOCKS_LIMITED: OpenAPIObject["paths"] = {
  "/l2/blocks/orphans": {
    get: {
      tags: ["L2", "blocks"],
      summary: "Get the last 100 orphaned blocks",
      responses: blockResponseArray,
    },
  },
};

export const GET_ORPHANED_BLOCKS_LIMITED = asyncHandler(async (_req, res) => {
  const orphanedBlocksData = await dbWrapper.getLatest(
    ["l2", "blocks", "orphans"],
    () => db.l2Block.getOrphanedBlocks(100),
  );
  res.status(200).json(JSON.parse(orphanedBlocksData));
});
