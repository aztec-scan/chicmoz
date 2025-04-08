import {
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UnconstrainedFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { ContractL2API } from "~/api";
import { REFETCH_INTERVAL, queryKeyGenerator } from "./utils";

export const useContractClasses = (
  classId?: string
): UseQueryResult<ChicmozL2ContractClassRegisteredEvent[], Error> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.contractClass({ classId }),
    queryFn: () => ContractL2API.getContractClasses(classId),
  });
};

export const useLatestContractClasses = (
  classId?: string
): UseQueryResult<ChicmozL2ContractClassRegisteredEvent[], Error> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.latestContractClasses(classId),
    queryFn: () => ContractL2API.getContractClasses(classId),
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useContractClass = ({
  classId,
  version,
  includeArtifactJson,
}: {
  classId: string;
  version: string;
  includeArtifactJson?: boolean;
}): UseQueryResult<ChicmozL2ContractClassRegisteredEvent, Error> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent, Error>({
    queryKey: queryKeyGenerator.contractClass({
      classId,
      version,
    }),
    queryFn: () => ContractL2API.getContractClass({ classId, version, includeArtifactJson }),
  });
};

export const useContractClassPrivateFunctions = (
  classId: string
): UseQueryResult<ChicmozL2PrivateFunctionBroadcastedEvent[], Error> => {
  return useQuery<ChicmozL2PrivateFunctionBroadcastedEvent[], Error>({
    queryKey: queryKeyGenerator.contractClassPrivateFunctions(classId),
    queryFn: () => ContractL2API.getContractClassPrivateFunctions(classId),
  });
};

export const useContractClassUnconstrainedFunctions = (
  classId: string
): UseQueryResult<ChicmozL2UnconstrainedFunctionBroadcastedEvent[], Error> => {
  return useQuery<ChicmozL2UnconstrainedFunctionBroadcastedEvent[], Error>({
    queryKey: queryKeyGenerator.contractClassUnconstrainedFunctions(classId),
    queryFn: () =>
      ContractL2API.getL2ContractClassUnconstrainedFunctions(classId),
  });
};

export const useContractInstance = (
  address: string
): UseQueryResult<ChicmozL2ContractInstanceDeluxe, Error> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe, Error>({
    queryKey: queryKeyGenerator.contractInstance(address),
    queryFn: () => ContractL2API.getContractInstance(address),
  });
};

export const useLatestContractInstances = (): UseQueryResult<
  ChicmozL2ContractInstanceDeluxe[],
  Error
> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe[], Error>({
    queryKey: queryKeyGenerator.latestContractInstances,
    queryFn: () => ContractL2API.getContractInstances(),
  });
};

export const useDeployedContractInstances = (
  classId: string
): UseQueryResult<ChicmozL2ContractInstanceDeluxe[], Error> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe[], Error>({
    queryKey: queryKeyGenerator.deployedContractInstances(classId),
    queryFn: () => ContractL2API.getContractInstancesByClassId(classId),
  });
};
