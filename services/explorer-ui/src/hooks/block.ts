import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
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
  heightOrHash: string
): UseQueryResult<ChicmozL2BlockLight, Error> => {
  console.log("useGetBlockByIdentifier", heightOrHash);
  return useQuery<ChicmozL2BlockLight, Error>({
    queryKey: queryKeyGenerator.blockByHeight(heightOrHash),
    queryFn: () => heightOrHash.startsWith("0x") ? BlockAPI.getBlockByHash(heightOrHash) : BlockAPI.getBlockByHeight(heightOrHash),
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
