import asyncHandler from "express-async-handler";
import { controllers as db } from "../../../database/index.js";
import { dbWrapper } from "./utils/index.js";
import {
  getBlocksSchema,
  getTxEffectsByBlockHeightSchema,
} from "../paths_and_validation.js";

export const GET_BLOCK_UI_TABLE_DATA = asyncHandler(async (req, res) => {
  const { from, to } = getBlocksSchema.parse(req).query;
  const blocksData = await dbWrapper.getLatest(
    ["l2", "blocks", "ui", from, to],
    () => db.ui.getBlocksForUiTable({ from, to }),
  );
  res.status(200).json(JSON.parse(blocksData));
});

export const GET_TX_EFFECTS_UI_TABLE_DATA = asyncHandler(async (req, res) => {
  const { from, to } = getBlocksSchema.parse(req).query;
  const blocksData = await dbWrapper.getLatest(
    ["l2", "txEffects", "ui", from, to],
    () => db.ui.getTxEffectForUiTable({ from, to, getType: 0 }),
  );
  res.status(200).json(JSON.parse(blocksData));
});

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
