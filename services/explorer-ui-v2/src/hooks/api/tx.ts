import {
  type ChicmozL2PendingL2ToL1Msg,
  type ChicmozL2PendingTx,
  type PublicCallRequest,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { TxAPI } from "~/api";
import {
  LIVE_REFETCH_INTERVAL,
  LONG_STALE_TIME,
  queryKeyGenerator,
} from "./utils";

export const usePendingTxs = (): UseQueryResult<
  ChicmozL2PendingTx[],
  Error
> => {
  return useQuery<ChicmozL2PendingTx[], Error>({
    queryKey: queryKeyGenerator.pendingTxs,
    queryFn: () => TxAPI.getPendingTxs(),
    refetchInterval: LIVE_REFETCH_INTERVAL,
  });
};

export const usePendingTxsByHash = (
  hash: string,
): UseQueryResult<ChicmozL2PendingTx, Error> => {
  return useQuery<ChicmozL2PendingTx, Error>({
    queryKey: queryKeyGenerator.pendingTxsByHash(hash),
    queryFn: () => TxAPI.getPendingTxsByHash(hash),
    enabled: !!hash,
  });
};

export const usePublicCallRequestsByTxHash = (
  hash: string,
): UseQueryResult<PublicCallRequest[], Error> =>
  useQuery<PublicCallRequest[], Error>({
    queryKey: queryKeyGenerator.publicCallRequestsByTxHash(hash),
    queryFn: () => TxAPI.getPublicCallRequestsByTxHash(hash),
    enabled: !!hash,
    staleTime: LONG_STALE_TIME,
  });

export const usePublicCallRequestsByContract = (
  address: string,
): UseQueryResult<PublicCallRequest[], Error> =>
  useQuery<PublicCallRequest[], Error>({
    queryKey: queryKeyGenerator.publicCallRequestsByContract(address),
    queryFn: () => TxAPI.getPublicCallRequestsByContract(address),
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });

export const usePublicCallRequestsBySender = (
  address: string,
): UseQueryResult<PublicCallRequest[], Error> =>
  useQuery<PublicCallRequest[], Error>({
    queryKey: queryKeyGenerator.publicCallRequestsBySender(address),
    queryFn: () => TxAPI.getPublicCallRequestsBySender(address),
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });

export const useL2ToL1MsgsByContract = (
  address: string,
): UseQueryResult<ChicmozL2PendingL2ToL1Msg[], Error> =>
  useQuery<ChicmozL2PendingL2ToL1Msg[], Error>({
    queryKey: queryKeyGenerator.l2ToL1MsgsByContract(address),
    queryFn: () => TxAPI.getL2ToL1MsgsByContract(address),
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });

export const useL2ToL1MsgsByRecipient = (
  address: string,
): UseQueryResult<ChicmozL2PendingL2ToL1Msg[], Error> =>
  useQuery<ChicmozL2PendingL2ToL1Msg[], Error>({
    queryKey: queryKeyGenerator.l2ToL1MsgsByRecipient(address),
    queryFn: () => TxAPI.getL2ToL1MsgsByRecipient(address),
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });
