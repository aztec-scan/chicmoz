import {
  type ChicmozContractInstanceBalance,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
  type ChicmozL2ContractInstanceWithAztecScanNotes,
  type ContractClassSourceResponse,
  ContractL2API,
} from "~/api";
import {
  DEFAULT_STALE_TIME,
  LONG_STALE_TIME,
  SLOW_REFETCH_INTERVAL,
  queryKeyGenerator,
} from "./utils";

export const useContractClasses = (
  classId?: string,
): UseQueryResult<ChicmozL2ContractClassRegisteredEvent[], Error> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.contractClass({ classId }),
    queryFn: () => ContractL2API.getContractClasses(classId),
  });
};

export const useLatestContractClasses = (): UseQueryResult<
  ChicmozL2ContractClassRegisteredEvent[],
  Error
> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.latestContractClasses,
    queryFn: () => ContractL2API.getContractClasses(),
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};

export type ContractFilter = "all" | "verified" | "protocol";

export const usePaginatedContractClasses = (
  page: number,
  pageSize: number,
  filter: ContractFilter = "all",
): UseQueryResult<ChicmozL2ContractClassRegisteredEvent[], Error> => {
  const offset = page * pageSize;
  const verified = filter === "verified" ? true : undefined;
  const protocol = filter === "protocol" ? true : undefined;
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.paginatedContractClasses(
      offset,
      pageSize,
      filter,
    ),
    queryFn: () =>
      ContractL2API.getContractClasses(
        undefined,
        undefined,
        offset,
        pageSize,
        verified,
        protocol,
      ),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
};

export const useVerifiedSourceContractClasses = (): UseQueryResult<
  ChicmozL2ContractClassRegisteredEvent[],
  Error
> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.contractClass({ verifiedSourceOnly: true }),
    queryFn: () => ContractL2API.getContractClasses(undefined, true),
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};

export const useContractClass = ({
  classId,
  version,
}: {
  classId: string;
  version: string;
}): UseQueryResult<ChicmozL2ContractClassRegisteredEvent, Error> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent, Error>({
    queryKey: queryKeyGenerator.contractClass({ classId, version }),
    queryFn: () => ContractL2API.getContractClass({ classId, version }),
    enabled: !!classId && !!version,
    // The bytecode is immutable, but verification/source/standard metadata can
    // be attached after registration through the explorer API.
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const useContractClassPrivateFunctions = (
  classId: string,
): UseQueryResult<ChicmozL2PrivateFunctionBroadcastedEvent[], Error> => {
  return useQuery<ChicmozL2PrivateFunctionBroadcastedEvent[], Error>({
    queryKey: queryKeyGenerator.contractClassPrivateFunctions(classId),
    queryFn: () => ContractL2API.getContractClassPrivateFunctions(classId),
    enabled: !!classId,
    staleTime: 10 * 60_000,
  });
};

export const useContractClassUtilityFunctions = (
  classId: string,
): UseQueryResult<ChicmozL2UtilityFunctionBroadcastedEvent[], Error> => {
  return useQuery<ChicmozL2UtilityFunctionBroadcastedEvent[], Error>({
    queryKey: queryKeyGenerator.contractClassUtilityFunctions(classId),
    queryFn: () => ContractL2API.getContractClassUtilityFunctions(classId),
    enabled: !!classId,
    staleTime: 10 * 60_000,
  });
};

export const useContractClassSource = (
  classId: string,
  version: string,
  enabled = true,
): UseQueryResult<ContractClassSourceResponse, Error> => {
  return useQuery<ContractClassSourceResponse, Error>({
    queryKey: queryKeyGenerator.contractClassSource(classId, version),
    queryFn: () => ContractL2API.getContractClassSource({ classId, version }),
    enabled,
    retry: false,
    staleTime: 10 * 60_000,
  });
};

export const useContractInstance = (
  address: string,
): UseQueryResult<ChicmozL2ContractInstanceDeluxe, Error> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe, Error>({
    queryKey: queryKeyGenerator.contractInstance(address),
    queryFn: () => ContractL2API.getContractInstance(address),
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });
};

export const useContractInstanceBalance = (
  address: string,
): UseQueryResult<ChicmozContractInstanceBalance | null, Error> => {
  return useQuery<ChicmozContractInstanceBalance | null, Error>({
    queryKey: queryKeyGenerator.contractInstanceBalance(address),
    queryFn: () => ContractL2API.getContractInstanceBalance(address),
    enabled: !!address,
    retry: false,
    // Balance can change per block — but not worth polling per-second.
    staleTime: 30_000,
  });
};

export const useContractInstanceBalanceHistory = (
  address: string,
): UseQueryResult<ChicmozContractInstanceBalance[], Error> => {
  return useQuery<ChicmozContractInstanceBalance[], Error>({
    queryKey: queryKeyGenerator.contractInstanceBalanceHistory(address),
    queryFn: () => ContractL2API.getContractInstanceBalanceHistory(address),
    enabled: !!address,
    retry: false,
    staleTime: 30_000,
  });
};

export const useLatestContractInstances = (): UseQueryResult<
  ChicmozL2ContractInstanceDeluxe[],
  Error
> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe[], Error>({
    queryKey: queryKeyGenerator.latestContractInstances,
    queryFn: () => ContractL2API.getContractInstances(),
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};

export const useContractInstancesWithAztecScanNotes = (): UseQueryResult<
  ChicmozL2ContractInstanceWithAztecScanNotes[],
  Error
> => {
  return useQuery<ChicmozL2ContractInstanceWithAztecScanNotes[], Error>({
    queryKey: queryKeyGenerator.contractInstancesWithAztecScanNotes,
    queryFn: () => ContractL2API.getContractInstancesWithAztecScanNotes(),
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};

export const usePaginatedContractInstances = (
  page: number,
  pageSize: number,
  filter: ContractFilter = "all",
): UseQueryResult<ChicmozL2ContractInstanceDeluxe[], Error> => {
  const offset = page * pageSize;
  const verified = filter === "verified" ? true : undefined;
  const protocol = filter === "protocol" ? true : undefined;
  return useQuery<ChicmozL2ContractInstanceDeluxe[], Error>({
    queryKey: queryKeyGenerator.paginatedContractInstances(
      offset,
      pageSize,
      filter,
    ),
    queryFn: () =>
      ContractL2API.getContractInstances(offset, pageSize, verified, protocol),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
};

export const useDeployedContractInstances = (
  classId: string,
): UseQueryResult<ChicmozL2ContractInstanceDeluxe[], Error> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe[], Error>({
    queryKey: queryKeyGenerator.deployedContractInstances(classId),
    queryFn: () => ContractL2API.getContractInstancesByClassId(classId),
    enabled: !!classId,
    staleTime: LONG_STALE_TIME,
  });
};
