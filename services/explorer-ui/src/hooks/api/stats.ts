import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { statsL2Api } from "~/api/stats";
import { queryKeyGenerator } from "./utils";

export const useTotalTxEffects = (): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalTxEffects,
    queryFn: statsL2Api.getL2TotalTxEffects,
  });
};

export const useTotalTxEffectsLast24h = (): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalTxEffectsLast24h,
    queryFn: statsL2Api.getL2TotalTxEffectsLast24h,
  });
};

export const useTotalContracts = (): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalContracts,
    queryFn: statsL2Api.getL2TotalContracts,
  });
};

export const useTotalContractsLast24h = (): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.totalContractsLast24h,
    queryFn: statsL2Api.getL2TotalContractsLast24h,
  });
};

export const useAvarageFees = (): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.averageFees,
    queryFn: statsL2Api.getL2AverageFees,
  });
};

export const useAvarageBlockTime = (): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.averageBlockTime,
    queryFn: statsL2Api.getL2AverageBlockTime,
  });
};

export const useAmountContractClassInstaces = (
  classId: string,
): UseQueryResult<string, Error> => {
  return useQuery<string, Error>({
    queryKey: queryKeyGenerator.amountContractClassInstaces(classId),
    queryFn: () => statsL2Api.getAmountContractClassInstaces(classId),
  });
};
