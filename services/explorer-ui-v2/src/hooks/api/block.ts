import {
  type ChicmozL2BlockLight,
  type ChicmozReorg,
  type UiBlockTable,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { BlockAPI } from "~/api";
import {
  LIVE_REFETCH_INTERVAL,
  REFETCH_INTERVAL,
  SLOW_REFETCH_INTERVAL,
  queryKeyGenerator,
} from "./utils";

export const useLatestBlock = (): UseQueryResult<
  ChicmozL2BlockLight,
  Error
> => {
  return useQuery<ChicmozL2BlockLight, Error>({
    queryKey: queryKeyGenerator.latestBlock,
    queryFn: BlockAPI.getLatestBlock,
    // Tip drives the live countdown, so we poll a bit more often; the WS
    // listener will usually invalidate the cache before the interval fires.
    refetchInterval: LIVE_REFETCH_INTERVAL,
  });
};

export const useGetBlockByIdentifier = (
  heightOrHash: string,
): UseQueryResult<ChicmozL2BlockLight, Error> => {
  return useQuery<ChicmozL2BlockLight, Error>({
    queryKey: queryKeyGenerator.blockByHeight(heightOrHash),
    queryFn: () =>
      heightOrHash.startsWith("0x")
        ? BlockAPI.getBlockByHash(heightOrHash)
        : BlockAPI.getBlockByHeight(heightOrHash),
    enabled: !!heightOrHash,
    // Historical blocks don't mutate; cache them for a while so walking
    // next/prev on the detail page is instant.
    staleTime: 5 * 60_000,
  });
};

export const useLatestTableBlocks = (): UseQueryResult<
  UiBlockTable[],
  Error
> => {
  return useQuery<UiBlockTable[], Error>({
    queryKey: queryKeyGenerator.latestTableBlocks,
    queryFn: () => BlockAPI.getLatestTableBlocks(),
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useBlocksByFinalizationStatus = (): UseQueryResult<
  ChicmozL2BlockLight[],
  Error
> => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: queryKeyGenerator.blocksByStatus,
    queryFn: () => BlockAPI.getBlocksByStatus(),
    refetchInterval: SLOW_REFETCH_INTERVAL,
  });
};

export const useOrphanedBlocksLimited = (): UseQueryResult<
  ChicmozL2BlockLight[],
  Error
> => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: queryKeyGenerator.orphanedBlocks,
    queryFn: () => BlockAPI.getOrphanedBlocksLimited(),
    retry: false,
  });
};

export const useReorgs = (): UseQueryResult<ChicmozReorg[], Error> => {
  return useQuery<ChicmozReorg[], Error>({
    queryKey: queryKeyGenerator.reorgs,
    queryFn: async () => {
      try {
        return await BlockAPI.getReorgs();
      } catch {
        return [];
      }
    },
    retry: false,
  });
};

export const usePaginatedTableBlocks = (
  page = 0,
  pageSize = 20,
): UseQueryResult<UiBlockTable[], Error> => {
  return useQuery<UiBlockTable[], Error>({
    queryKey: queryKeyGenerator.paginatedTableBlocks(page, pageSize),
    queryFn: async () => {
      const latestHeight = await BlockAPI.getLatestHeight();
      const endHeight = latestHeight - page * pageSize;
      const startHeight = Math.max(1, endHeight - pageSize + 1);
      if (endHeight < 1) {return [];}
      return BlockAPI.getLatestTableBlocksByHeightRange(
        startHeight,
        endHeight + 1,
      );
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
};
