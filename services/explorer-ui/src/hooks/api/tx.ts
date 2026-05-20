import {
  type ChicmozL2PendingTx,
  type ChicmozL2PendingL2ToL1Msg,
  type PublicCallRequest,
} from "@chicmoz-pkg/types";
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

export const usePublicCallRequestsByContract = (
  address: string,
): UseQueryResult<PublicCallRequest[], Error> => {
  return useQuery<PublicCallRequest[], Error>({
    queryKey: queryKeyGenerator.publicCallRequestsByContract(address),
    queryFn: () => TxAPI.getPublicCallRequestsByContract(address),
  });
};

export const useL2ToL1MsgsByContract = (
  address: string,
): UseQueryResult<ChicmozL2PendingL2ToL1Msg[], Error> => {
  return useQuery<ChicmozL2PendingL2ToL1Msg[], Error>({
    queryKey: queryKeyGenerator.l2ToL1MsgsByContract(address),
    queryFn: () => TxAPI.getL2ToL1MsgsByContract(address),
  });
};

export const usePublicCallRequestsBySender = (
  address: string,
): UseQueryResult<PublicCallRequest[], Error> =>
  useQuery({
    queryKey: queryKeyGenerator.publicCallRequestsBySender(address),
    queryFn: () => TxAPI.getPublicCallRequestsBySender(address),
  });

export const useL2ToL1MsgsByRecipient = (
  address: string,
): UseQueryResult<ChicmozL2PendingL2ToL1Msg[], Error> =>
  useQuery({
    queryKey: queryKeyGenerator.l2ToL1MsgsByRecipient(address),
    queryFn: () => TxAPI.getL2ToL1MsgsByRecipient(address),
  });

export const usePublicCallRequestsByTxHash = (
  txHash: string,
): UseQueryResult<PublicCallRequest[], Error> =>
  useQuery({
    queryKey: queryKeyGenerator.publicCallRequestsByTxHash(txHash),
    queryFn: () => TxAPI.getPublicCallRequestsByTxHash(txHash),
  });
