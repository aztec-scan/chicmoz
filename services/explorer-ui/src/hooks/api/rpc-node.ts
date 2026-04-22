import {
  type PublicChicmozL2RpcNode,
  type PublicChicmozL2RpcNodeDeluxe,
} from "@chicmoz-pkg/types";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { RpcNodeAPI } from "~/api";
import { queryKeyGenerator, REFETCH_INTERVAL } from "./utils";

export const useRpcNodes = (): UseQueryResult<
  PublicChicmozL2RpcNode[],
  Error
> => {
  return useQuery<PublicChicmozL2RpcNode[], Error>({
    queryKey: queryKeyGenerator.rpcNodes,
    queryFn: () => RpcNodeAPI.getAllRpcNodes(),
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useRpcNode = (
  rpcNodeName: string,
): UseQueryResult<PublicChicmozL2RpcNodeDeluxe, Error> => {
  return useQuery<PublicChicmozL2RpcNodeDeluxe, Error>({
    queryKey: queryKeyGenerator.rpcNode(rpcNodeName),
    queryFn: () => RpcNodeAPI.getRpcNodeByName(rpcNodeName),
    refetchInterval: REFETCH_INTERVAL,
  });
};
