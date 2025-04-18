import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { TxAPI } from "~/api";
import { queryKeyGenerator } from "./utils";

export const usePendingTxs = (): UseQueryResult<
  ChicmozL2PendingTx[],
  Error
> => {
  return useQuery<ChicmozL2PendingTx[], Error>({
    queryKey: queryKeyGenerator.pendingTxs,
    queryFn: () => TxAPI.getPendingTxs(),
  });
};

export const usePendingTxsByHash = (
  hash: string,
): UseQueryResult<ChicmozL2PendingTx, Error> => {
  return useQuery<ChicmozL2PendingTx, Error>({
    queryKey: queryKeyGenerator.pendingTxsByHash(hash),
    queryFn: () => TxAPI.getPendingTxsByHash(hash),
  });
};
