import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import { dbWrapper ,
  uiBlockTableResponseArray,
  uiTxEffectTableResponseArray,
} from "./utils/index.js";
import {
  getBlocksSchema,
  getTxEffectsByBlockHeightSchema,
} from "../paths_and_validation.js";

export const openapi_GET_BLOCK_UI_TABLE_DATA: OpenAPIObject["paths"] = {
  "/l2/ui/blocks-for-table": {
    get: {
      tags: ["L2", "ui", "blocks"],
      summary: "Get block table rows for the UI",
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
      responses: uiBlockTableResponseArray,
    },
  },
};

export const GET_BLOCK_UI_TABLE_DATA = asyncHandler(async (req, res) => {
  const { from, to } = getBlocksSchema.parse(req).query;
  const blocksData = await dbWrapper.getLatest(
    ["l2", "blocks", "ui", from, to],
    () => db.ui.getBlocksForUiTable({ from, to }),
  );
  res.status(200).json(JSON.parse(blocksData));
});

export const openapi_GET_TX_EFFECTS_UI_TABLE_DATA: OpenAPIObject["paths"] = {
  "/l2/ui/tx-effects-for-table": {
    get: {
      tags: ["L2", "ui", "tx-effects"],
      summary: "Get tx effect table rows for the UI",
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
      responses: uiTxEffectTableResponseArray,
    },
  },
};

export const GET_TX_EFFECTS_UI_TABLE_DATA = asyncHandler(async (req, res) => {
  const { from, to } = getBlocksSchema.parse(req).query;
  const blocksData = await dbWrapper.getLatest(
    ["l2", "txEffects", "ui", from, to],
    () => db.ui.getTxEffectForUiTable({ from, to, getType: 0 }),
  );
  res.status(200).json(JSON.parse(blocksData));
});

export const openapi_GET_TX_EFFECTS_BY_BLOCK_HEIGHT_UI_TABLE: OpenAPIObject["paths"] =
  {
    "/l2/ui/tx-effects-for-table/{blockHeight}": {
      get: {
        tags: ["L2", "ui", "tx-effects"],
        summary: "Get tx effect table rows for a block height",
        parameters: [
          {
            name: "blockHeight",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: uiTxEffectTableResponseArray,
      },
    },
  };

export const GET_TX_EFFECTS_BY_BLOCK_HEIGHT_UI_TABLE = asyncHandler(
  async (req, res) => {
    const { blockHeight } = getTxEffectsByBlockHeightSchema.parse(req).params;
    const txEffectsData = await dbWrapper.get(
      ["l2", "blocks", blockHeight, "txEffects"],
      () => db.ui.getTxEffectForUiTable({ blockHeight, getType: 1 }),
    );
    res.status(200).json(JSON.parse(txEffectsData));
  },
);
