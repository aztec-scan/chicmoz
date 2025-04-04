import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getTxEffectByBlockHeightAndIndexSchema,
  getTxEffectsByBlockHeightSchema,
  getTxEffectsByTxHashSchema,
} from "../paths_and_validation.js";
import {
  dbWrapper,
  txEffectResponse,
  txEffectResponseArray,
} from "./utils/index.js";

export const openapi_GET_L2_TX_EFFECTS: OpenAPIObject["paths"] = {
  "/l2/tx-effects": {
    get: {
      tags: ["L2", "tx-effects"],
      summary: "Get all transaction effects",
      responses: txEffectResponseArray,
    },
  },
};

export const GET_L2_TX_EFFECTS = asyncHandler(async (_req, res) => {
  // TODO: this should be extended to enable querying for block-height ranges
  const txEffectsData = await dbWrapper.getLatest(["l2", "txEffects"], () =>
    db.l2TxEffect.getLatestTxEffects(),
  );
  res.status(200).send(txEffectsData);
});

export const openapi_GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT: OpenAPIObject["paths"] =
  {
    "/l2/blocks/{blockHeight}/txEffects": {
      get: {
        tags: ["L2", "tx-effects"],
        summary: "Get transaction effects by block height",
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
        responses: txEffectResponseArray,
      },
    },
  };

export const GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT = asyncHandler(
  async (req, res) => {
    const { blockHeight } = getTxEffectsByBlockHeightSchema.parse(req).params;
    const txEffectsData = await dbWrapper.get(
      ["l2", "blocks", blockHeight, "txEffects"],
      () => db.l2TxEffect.getTxEffectsByBlockHeight(blockHeight),
    );
    res.status(200).send(txEffectsData);
  },
);

export const openapi_GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX: OpenAPIObject["paths"] =
  {
    "/l2/blocks/{blockHeight}/txEffects/{txEffectIndex}": {
      get: {
        tags: ["L2", "tx-effects"],
        summary: "Get a specific transaction effect by block height and index",
        parameters: [
          {
            name: "blockHeight",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
          {
            name: "txEffectIndex",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: txEffectResponse,
      },
    },
  };

export const GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX = asyncHandler(
  async (req, res) => {
    const { blockHeight, txEffectIndex } =
      getTxEffectByBlockHeightAndIndexSchema.parse(req).params;
    const txEffectsData = await dbWrapper.get(
      ["l2", "blocks", blockHeight, "txEffects", txEffectIndex],
      () =>
        db.l2TxEffect.getTxEffectByBlockHeightAndIndex(
          blockHeight,
          txEffectIndex,
        ),
    );
    res.status(200).send(txEffectsData);
  },
);

export const openapi_GET_L2_TX_EFFECT_BY_TX_EFFECT_HASH: OpenAPIObject["paths"] =
  {
    "/l2/txEffects/{hash}": {
      get: {
        tags: ["L2", "tx-effects"],
        summary: "Get transaction effects by tx effect hash",
        parameters: [
          {
            name: "hash",
            in: "path",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[a-fA-F0-9]+$",
            },
          },
        ],
        responses: txEffectResponse,
      },
    },
  };

export const GET_L2_TX_EFFECT_BY_TX_EFFECT_HASH = asyncHandler(
  async (req, res) => {
    const { txEffectHash } = getTxEffectsByTxHashSchema.parse(req).params;
    const txEffectsData = await dbWrapper.get(
      ["l2", "txEffects", txEffectHash],
      () => db.l2TxEffect.getTxEffectByHash(txEffectHash),
    );
    res.status(200).send(txEffectsData);
  },
);
