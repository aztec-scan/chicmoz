import {
  chicmozL2TxEffectDeluxeSchema,
  type ChicmozL2TxEffectDeluxe,
  chicmozL2BlockSchema,
  type UiTxEffectTable,
  uiTxEffectTableSchema,
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
    return validateResponse(
      z.array(chicmozL2TxEffectDeluxeSchema),
      response.data,
    );
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
  getLatestTableTxEffect: async (): Promise<UiTxEffectTable[]> => {
    const response = await client.get(aztecExplorer.getTableTxEffects);

    return validateResponse(z.array(uiTxEffectTableSchema), response.data);
  },
  getTableTxEffectsByBlockHeight: async (
    height: bigint,
  ): Promise<UiTxEffectTable[]> => {
    const response = await client.get(
      aztecExplorer.getTableTxEffectsByHeight(height),
    );
    return validateResponse(z.array(uiTxEffectTableSchema), response.data);
  },
  getLatestTableTxEffectByHeightRange: async (
    start?: number,
    end?: number,
  ): Promise<UiTxEffectTable[]> => {
    const params: { from?: number; to?: number } = {};
    if (start) {
      params.from = start;
    }
    if (end) {
      params.to = end;
    }
    const response = await client.get(aztecExplorer.getTableTxEffects, {
      params,
    });

    return validateResponse(z.array(uiTxEffectTableSchema), response.data);
  },
  getLatestTxEffects: async (): Promise<ChicmozL2TxEffectDeluxe[]> => {
    const response = await client.get(aztecExplorer.getL2TxEffects);
    return validateResponse(
      z.array(chicmozL2TxEffectDeluxeSchema),
      response.data,
    );
  },
};
