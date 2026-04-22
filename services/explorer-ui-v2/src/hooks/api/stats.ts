import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { statsL2Api } from "~/api";
import { LONG_STALE_TIME, queryKeyGenerator } from "./utils";

// Aggregate stats barely move second-to-second — cache them for a minute
// and only refetch when the cache goes stale.
const statsOpts = {
  staleTime: LONG_STALE_TIME,
  refetchInterval: LONG_STALE_TIME,
} as const;

export const useTotalTxEffects = (): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalTxEffects,
    queryFn: statsL2Api.getL2TotalTxEffects,
    ...statsOpts,
  });

export const useTotalTxEffectsLast24h = (): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalTxEffectsLast24h,
    queryFn: statsL2Api.getL2TotalTxEffectsLast24h,
    ...statsOpts,
  });

export const useTotalContracts = (): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalContracts,
    queryFn: statsL2Api.getL2TotalContracts,
    ...statsOpts,
  });

export const useTotalContractsLast24h = (): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalContractsLast24h,
    queryFn: statsL2Api.getL2TotalContractsLast24h,
    ...statsOpts,
  });

export const useAverageFees = (): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.averageFees,
    queryFn: statsL2Api.getL2AverageFees,
    ...statsOpts,
  });

export const useAverageBlockTime = (): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.averageBlockTime,
    queryFn: statsL2Api.getL2AverageBlockTime,
    ...statsOpts,
  });

export const useAmountContractClassInstances = (
  classId: string,
): UseQueryResult<string, Error> =>
  useQuery<string, Error>({
    queryKey: queryKeyGenerator.amountContractClassInstances(classId),
    queryFn: () => statsL2Api.getAmountContractClassInstances(classId),
    enabled: !!classId,
    staleTime: LONG_STALE_TIME,
  });
