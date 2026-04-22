import {
  type ChicmozChainInfo,
  type ChicmozL2RpcNodeError,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { ChainInfoAPI } from "~/api";
import {
  LONG_STALE_TIME,
  SLOW_REFETCH_INTERVAL,
  queryKeyGenerator,
} from "./utils";

export const useChainInfo = (): UseQueryResult<ChicmozChainInfo, Error> => {
  return useQuery<ChicmozChainInfo, Error>({
    queryKey: queryKeyGenerator.chainInfo,
    queryFn: () => ChainInfoAPI.getChainInfo(),
    // Chain info (network id, contract addresses…) is effectively static.
    staleTime: 15 * 60_000,
  });
};

export const useChainErrors = (): UseQueryResult<
  ChicmozL2RpcNodeError[],
  Error
> => {
  return useQuery<ChicmozL2RpcNodeError[], Error>({
    queryKey: queryKeyGenerator.chainErrors,
    queryFn: () =>
      ChainInfoAPI.getChainErrors().then((chainErrors) =>
        [...chainErrors].sort(
          (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
        ),
      ),
    retry: false,
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};
