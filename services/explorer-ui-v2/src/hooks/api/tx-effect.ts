import {
  type ChicmozL2TxEffectDeluxe,
  type UiTxEffectTable,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { TxEffectsAPI } from "~/api";
import { REFETCH_INTERVAL, queryKeyGenerator } from "./utils";

export const useGetTxEffectByHash = (
  hash: string,
): UseQueryResult<ChicmozL2TxEffectDeluxe, Error> => {
  return useQuery<ChicmozL2TxEffectDeluxe, Error>({
    queryKey: queryKeyGenerator.txEffectByHash(hash),
    queryFn: () => TxEffectsAPI.getTxEffectByHash(hash),
    enabled: !!hash,
    // Mined tx effects are immutable — cache for 5min.
    staleTime: 5 * 60_000,
  });
};

export const useGetTxEffectsByBlockHeight = (
  height: bigint | string | number | undefined,
): UseQueryResult<ChicmozL2TxEffectDeluxe[], Error> => {
  return useQuery<ChicmozL2TxEffectDeluxe[], Error>({
    queryKey: queryKeyGenerator.txEffectsByBlockHeight(height),
    queryFn: () =>
      !height
        ? Promise.resolve([])
        : TxEffectsAPI.getTxEffectsByBlockHeight(BigInt(height)),
    enabled: height !== undefined,
    staleTime: 5 * 60_000,
  });
};

export const useGetTableTxEffectsByBlockHeight = (
  height: bigint | string | number | undefined,
): UseQueryResult<UiTxEffectTable[], Error> => {
  return useQuery<UiTxEffectTable[], Error>({
    queryKey: queryKeyGenerator.txEffectsByBlockHeight(height),
    queryFn: () =>
      !height
        ? Promise.resolve([])
        : TxEffectsAPI.getTableTxEffectsByBlockHeight(BigInt(height)),
    enabled: height !== undefined,
    staleTime: 5 * 60_000,
  });
};

export const useLatestTableTxEffects = (): UseQueryResult<
  UiTxEffectTable[],
  Error
> => {
  return useQuery<UiTxEffectTable[], Error>({
    queryKey: queryKeyGenerator.latestTableTxEffects,
    queryFn: () => TxEffectsAPI.getLatestTableTxEffect(),
    refetchInterval: REFETCH_INTERVAL,
  });
};
