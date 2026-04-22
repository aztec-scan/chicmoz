import {
  type ChicmozL2TxEffectDeluxe,
  type UiTxEffectTable,
  chicmozL2TxEffectDeluxeSchema,
  uiTxEffectTableSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const TxEffectsAPI = {
  getTxEffectByHash: async (hash: string): Promise<ChicmozL2TxEffectDeluxe> => {
    const response = await client.get(aztecExplorer.getL2TxEffectByHash(hash));
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
  getLatestTxEffects: async (): Promise<ChicmozL2TxEffectDeluxe[]> => {
    const response = await client.get(aztecExplorer.getL2TxEffects);
    return validateResponse(
      z.array(chicmozL2TxEffectDeluxeSchema),
      response.data,
    );
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
};
