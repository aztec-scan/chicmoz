import { type PublicChicmozL2RpcNode } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { RpcNodeAPI } from "~/api";
import {
  LONG_STALE_TIME,
  SLOW_REFETCH_INTERVAL,
  queryKeyGenerator,
} from "./utils";

export const useRpcNodes = (): UseQueryResult<
  PublicChicmozL2RpcNode[],
  Error
> => {
  return useQuery<PublicChicmozL2RpcNode[], Error>({
    queryKey: queryKeyGenerator.rpcNodes,
    queryFn: () => RpcNodeAPI.getAllRpcNodes(),
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};
