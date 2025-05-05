import { type ChicmozL2TxEffectDeluxe } from "@chicmoz-pkg/types";
import {
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { TxEffectsAPI } from "~/api";
import { queryKeyGenerator } from "./utils";

export const useGetTxEffectByHash = (
  hash: string,
): UseQueryResult<ChicmozL2TxEffectDeluxe, Error> => {
  return useQuery<ChicmozL2TxEffectDeluxe, Error>({
    queryKey: queryKeyGenerator.txEffectByHash(hash),
    queryFn: () => TxEffectsAPI.getTxEffectByHash(hash),
  });
};

export const useGetTxEffectsByBlockHeight = (
  height: bigint | string | number | undefined,
): UseQueryResult<ChicmozL2TxEffectDeluxe[], Error> => {
  if (typeof height === "string" && height?.startsWith("0x")) {
    throw new Error("Invalid block height");
  }
  return useQuery<ChicmozL2TxEffectDeluxe[], Error>({
    queryKey: queryKeyGenerator.txEffectsByBlockHeight(height),
    queryFn: () =>
      !height
        ? Promise.resolve([])
        : TxEffectsAPI.getTxEffectsByBlockHeight(BigInt(height)),
  });
};

export const useGetTxEffectsByBlockHeightRange = (
  from: bigint | undefined,
  to: bigint | undefined,
): UseQueryResult<(ChicmozL2TxEffectDeluxe | undefined)[], Error>[] => {
  return useQueries({
    queries:
      from === undefined || to === undefined
        ? []
        : new Array(Number(to) - Number(from) + 1).fill(0n).map((_, i) => ({
            queryKey: queryKeyGenerator.txEffectsByBlockHeight(to - BigInt(i)),
            queryFn: () =>
              TxEffectsAPI.getTxEffectsByBlockHeight(to - BigInt(i)),
          })),
  });
};

export const useGetLatestTxEffects = (): UseQueryResult<
  ChicmozL2TxEffectDeluxe[] | undefined,
  Error
> => {
  const queryClient = useQueryClient();
  return useQuery<ChicmozL2TxEffectDeluxe[] | undefined, Error>({
    queryKey: queryKeyGenerator.latestTxEffects,
    queryFn: async () => {
      const latestTxEffects = await TxEffectsAPI.getLatestTxEffects();
      if (!latestTxEffects) {
        return [];
      }
      if (latestTxEffects.length === 0) {
        return [];
      }
      let blockTxEffects: ChicmozL2TxEffectDeluxe[] = [];
      let currentBlockHeight = latestTxEffects[0].blockHeight;
      latestTxEffects.forEach((txEffect) => {
        if (txEffect.blockHeight !== currentBlockHeight) {
          queryClient.setQueryData(
            queryKeyGenerator.txEffectsByBlockHeight(currentBlockHeight),
            blockTxEffects,
          );
          blockTxEffects = [];
          currentBlockHeight = txEffect.blockHeight;
        }
        blockTxEffects.push(txEffect);
      });
      return latestTxEffects;
    },
  });
};
