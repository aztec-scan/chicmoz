import {
  type UiBlockTable,
  type ChicmozL2BlockLight,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { BlockAPI } from "~/api";
import { queryKeyGenerator } from "./utils";

export const useLatestBlock = (): UseQueryResult<
  ChicmozL2BlockLight,
  Error
> => {
  return useQuery<ChicmozL2BlockLight, Error>({
    queryKey: queryKeyGenerator.latestBlock,
    queryFn: BlockAPI.getLatestBlock,
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
  });
};

export const useLatestBlocks = (): UseQueryResult<
  ChicmozL2BlockLight[],
  Error
> => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: queryKeyGenerator.latestBlocks,
    queryFn: () => BlockAPI.getBlocksByHeightRange(),
  });
};

export const useLatestTableBlocks = (): UseQueryResult<
  UiBlockTable[],
  Error
> => {
  return useQuery<UiBlockTable[], Error>({
    queryKey: queryKeyGenerator.latestTableBlocks,
    queryFn: () => BlockAPI.getLatestTableBlocks(),
  });
};

export const useLatestTableBlocksByHeightRange = (
  from: number,
  to: number,
): UseQueryResult<UiBlockTable[], Error> => {
  return useQuery<UiBlockTable[], Error>({
    queryKey: queryKeyGenerator.latestTableBlocksRange(from, to),
    queryFn: () => BlockAPI.getLatestTableBlocksByHeightRange(from, to),
  });
};
export const useBlocksByRange = (
  start: number,
  end: number,
): UseQueryResult<ChicmozL2BlockLight[], Error> => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: queryKeyGenerator.blockByRange(start, end),
    queryFn: () => BlockAPI.getBlocksByHeightRange(start, end),
  });
};

export const usePaginatedTableBlocks = (
  page = 0,
  pageSize = 20, // API limit is 20 blocks per request
): UseQueryResult<UiBlockTable[], Error> => {
  return useQuery<UiBlockTable[], Error>({
    queryKey: queryKeyGenerator.paginatedTableBlocks(page, pageSize),
    queryFn: async () => {
      // Get latest block height to calculate the range for this page
      const latestHeight = await BlockAPI.getLatestHeight();

      // Calculate the range based on page and pageSize
      // Page 0 shows the latest blocks, page 1 shows older blocks, etc.
      const endHeight = latestHeight - page * pageSize;
      const startHeight = Math.max(1, endHeight - pageSize + 1);

      // Ensure we don't go below block 1
      if (endHeight < 1) {
        return [];
      }

      return BlockAPI.getLatestTableBlocksByHeightRange(
        startHeight,
        endHeight + 1,
      );
    },
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
