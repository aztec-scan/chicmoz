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
