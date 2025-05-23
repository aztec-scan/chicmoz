import {
  type ChicmozL2BlockLight,
  type ChicmozReorg,
  type UiBlockTable,
  chicmozL2BlockLightSchema,
  chicmozReorgSchema,
  uiBlockTableSchema,
} from "@chicmoz-pkg/types";
import client, { validateResponse } from "./client";
import { aztecExplorer } from "~/service/constants";
import { z } from "zod";

export const BlockAPI = {
  getLatestBlock: async (): Promise<ChicmozL2BlockLight> => {
    const response = await client.get(aztecExplorer.getL2LatestBlock);

    return validateResponse(chicmozL2BlockLightSchema, response.data);
  },
  getLatestTableBlocks: async (): Promise<UiBlockTable[]> => {
    const response = await client.get(aztecExplorer.getTableBlocks);

    return validateResponse(z.array(uiBlockTableSchema), response.data);
  },
  getLatestTableBlocksByHeightRange: async (
    start?: number,
    end?: number,
  ): Promise<UiBlockTable[]> => {
    const params: { from?: number; to?: number } = {};
    if (start) {
      params.from = start;
    }
    if (end) {
      params.to = end;
    }
    const response = await client.get(aztecExplorer.getTableBlocks, {
      params,
    });

    return validateResponse(z.array(uiBlockTableSchema), response.data);
  },
  getBlocksByStatus: async (): Promise<ChicmozL2BlockLight[]> => {
    const response = await client.get(aztecExplorer.getL2BlocksByStatus);
    return validateResponse(z.array(chicmozL2BlockLightSchema), response.data);
  },
  getOrphanedBlocks: async (): Promise<ChicmozL2BlockLight[]> => {
    const response = await client.get(aztecExplorer.getL2OrphanedBlocks);
    return validateResponse(z.array(chicmozL2BlockLightSchema), response.data);
  },
  getOrphanedBlocksLimited: async (): Promise<ChicmozL2BlockLight[]> => {
    const response = await client.get(aztecExplorer.getL2OrphanedBlocksLimited);
    return validateResponse(z.array(chicmozL2BlockLightSchema), response.data);
  },
  getReorgs: async (): Promise<ChicmozReorg[]> => {
    const response = await client.get(aztecExplorer.getL2Reorgs);
    return validateResponse(z.array(chicmozReorgSchema), response.data);
  },
  getLatestHeight: async (): Promise<number> => {
    const response = await client.get(aztecExplorer.getL2LatestHeight);
    return validateResponse(z.number(), response.data);
  },
  getBlockByHeight: async (height: string): Promise<ChicmozL2BlockLight> => {
    const response = await client.get(
      `${aztecExplorer.getL2BlockByHeight}${height}`,
    );
    return validateResponse(chicmozL2BlockLightSchema, response.data);
  },
  getBlocksByHeightRange: async (
    start?: number,
    end?: number,
  ): Promise<ChicmozL2BlockLight[]> => {
    const params: { from?: number; to?: number } = {};
    if (start) {
      params.from = start;
    }
    if (end) {
      params.to = end;
    }
    const response = await client.get(
      `${aztecExplorer.getL2BlocksByHeightRange}`,
      {
        params,
      },
    );
    return validateResponse(z.array(chicmozL2BlockLightSchema), response.data);
  },
  getBlockByHash: async (hash: string): Promise<ChicmozL2BlockLight> => {
    const response = await client.get(
      `${aztecExplorer.getL2BlockByHash}${hash}`,
    );
    return validateResponse(chicmozL2BlockLightSchema, response.data);
  },
};
