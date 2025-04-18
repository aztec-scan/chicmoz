import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import { dbWrapper, txResponse, txResponseArray } from "./utils/index.js";
import { getTxEffectsByTxHashSchema } from "../paths_and_validation.js";

export const openapi_GET_PENDING_TXS: OpenAPIObject["paths"] = {
  "/l2/txs": {
    get: {
      tags: ["L2", "pending-txs", "tx-effects"],
      summary: "Get pending transactions",
      parameters: [],
      responses: txResponseArray,
    },
  },
};

export const GET_PENDING_TXS = asyncHandler(async (_req, res) => {
  const txsData = await dbWrapper.getLatest(["l2", "txs"], () =>
    db.l2Tx.getTxs(),
  );
  res.status(200).send(txsData);
});

export const openapi_GET_PENDING_TX_BY_HASH: OpenAPIObject["paths"] = {
  "/l2/txs/{hash}": {
    get: {
      tags: ["L2", "pending-txs", "tx-effects"],
      summary: "Get pending transactions by tx hash",
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
      responses: txResponse,
    },
  },
};

export const GET_PENDING_TX_BY_HASH = asyncHandler(async (req, res) => {
  const { txEffectHash } = getTxEffectsByTxHashSchema.parse(req).params;
  const txsData = await dbWrapper.getLatest(["l2", "txs", txEffectHash], () =>
    db.l2Tx.getTxByHash(txEffectHash),
  );
  res.status(200).send(txsData);
});
