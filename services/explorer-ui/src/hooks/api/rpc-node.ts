import { type ChicmozL2RpcNode } from "@chicmoz-pkg/types";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { RpcNodeAPI } from "~/api";
import { queryKeyGenerator, REFETCH_INTERVAL } from "./utils";

export const useRpcNodes = (): UseQueryResult<ChicmozL2RpcNode[], Error> => {
  return useQuery<ChicmozL2RpcNode[], Error>({
    queryKey: queryKeyGenerator.rpcNodes,
    queryFn: () => RpcNodeAPI.getAllRpcNodes(),
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useRpcNode = (
  rpcNodeName: string,
): UseQueryResult<ChicmozL2RpcNode, Error> => {
  return useQuery<ChicmozL2RpcNode, Error>({
    queryKey: queryKeyGenerator.rpcNode(rpcNodeName),
    queryFn: () => RpcNodeAPI.getRpcNodeByName(rpcNodeName),
    refetchInterval: REFETCH_INTERVAL,
  });
};
