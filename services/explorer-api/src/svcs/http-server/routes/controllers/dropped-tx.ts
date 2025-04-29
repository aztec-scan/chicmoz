import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import { getTxEffectsByTxHashSchema } from "../paths_and_validation.js";
import { dbWrapper } from "./utils/index.js";

// Define the OpenAPI spec for the GET_DROPPED_TX_BY_HASH endpoint
export const openapi_GET_DROPPED_TX_BY_HASH: OpenAPIObject["paths"] = {
  "/l2/dropped-txs/{hash}": {
    get: {
      tags: ["L2", "dropped-txs", "tx-effects"],
      summary: "Get dropped transaction by hash",
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
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: {
                type: "object",
              },
            },
          },
        },
      },
    },
  },
};

// Define the controller function for GET_DROPPED_TX_BY_HASH
export const GET_DROPPED_TX_BY_HASH = asyncHandler(async (req, res) => {
  const { txEffectHash } = getTxEffectsByTxHashSchema.parse(req).params;
  const droppedTxData = await dbWrapper.getLatest(
    ["l2", "dropped-txs", txEffectHash],
    () => db.droppedTx.getDroppedTxByHash(txEffectHash)
  );
  res.status(200).json(JSON.parse(droppedTxData));
});
