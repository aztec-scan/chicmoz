import {
  chicmozL2TxEffectDeluxeSchema,
  type ChicmozL2TxEffectDeluxe,
  chicmozL2BlockSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const TxEffectsAPI = {
  getTxEffectByHash: async (hash: string): Promise<ChicmozL2TxEffectDeluxe> => {
    const response = await client.get(
      `${aztecExplorer.getL2TxEffectByHash}/${hash}`,
    );
    return validateResponse(chicmozL2TxEffectDeluxeSchema, response.data);
  },
  getTxEffectsByBlockHeight: async (
    height: bigint,
  ): Promise<ChicmozL2TxEffectDeluxe[]> => {
    const response = await client.get(
      aztecExplorer.getL2TxEffectsByHeight(height),
    );
    return validateResponse(z.array(chicmozL2TxEffectDeluxeSchema), response.data);
  },
  getTxEffectByBlockHeightAndIndex: async (
    height: bigint,
    index: number,
  ): Promise<bigint> => {
    const response = await client.get(
      aztecExplorer.getL2TxEffectByHeightAndIndex(height, index),
    );
    return validateResponse(chicmozL2BlockSchema.shape.height, response.data);
  },
  getTxEffectsByHeightRange: async (
    start: bigint,
    end: bigint,
  ): Promise<bigint> => {
    const response = await client.get(
      aztecExplorer.getL2TxEffectsByHeightRange,
      {
        params: {
          start,
          end,
        },
      },
    );
    return validateResponse(chicmozL2BlockSchema.shape.height, response.data);
  },
  getLatestTxEffects: async (): Promise<ChicmozL2TxEffectDeluxe[]> => {
    const response = await client.get(aztecExplorer.getL2TxEffects);
    return validateResponse(z.array(chicmozL2TxEffectDeluxeSchema), response.data);
  }
};
