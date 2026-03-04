import {
  type ChicmozContractInstanceBalance,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
  type SourceVerificationJob,
} from "@chicmoz-pkg/types";
import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  type ChicmozL2ContractInstanceWithAztecScanNotes,
  type ContractClassSourceResponse,
  type VerifySourceResponse,
  ContractL2API,
} from "~/api";
import { REFETCH_INTERVAL, queryKeyGenerator } from "./utils";

export const useContractClasses = (
  classId?: string,
): UseQueryResult<ChicmozL2ContractClassRegisteredEvent[], Error> => {
  return useQuery<ChicmozL2ContractClassRegisteredEvent[], Error>({
    queryKey: queryKeyGenerator.contractClass({ classId }),
    queryFn: () => ContractL2API.getContractClasses(classId),
  });
};

export const useLatestContractClasses = (
  classId?: string,
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
    queryFn: () =>
      ContractL2API.getContractClass({ classId, version, includeArtifactJson }),
  });
};

export const useContractClassPrivateFunctions = (
  classId: string,
): UseQueryResult<ChicmozL2PrivateFunctionBroadcastedEvent[], Error> => {
  return useQuery<ChicmozL2PrivateFunctionBroadcastedEvent[], Error>({
    queryKey: queryKeyGenerator.contractClassPrivateFunctions(classId),
    queryFn: () => ContractL2API.getContractClassPrivateFunctions(classId),
  });
};

export const useContractClassUtilityFunctions = (
  classId: string,
): UseQueryResult<ChicmozL2UtilityFunctionBroadcastedEvent[], Error> => {
  return useQuery<ChicmozL2UtilityFunctionBroadcastedEvent[], Error>({
    queryKey: queryKeyGenerator.contractClassUtilityFunctions(classId),
    queryFn: () => ContractL2API.getL2ContractClassUtilityFunctions(classId),
  });
};

export const useContractInstance = (
  address: string,
  includeArtifactJson?: boolean,
): UseQueryResult<ChicmozL2ContractInstanceDeluxe, Error> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe, Error>({
    queryKey: queryKeyGenerator.contractInstance(address),
    queryFn: () =>
      ContractL2API.getContractInstance({
        address,
        includeArtifactJson,
      }),
  });
};

export const useContractInstanceBalance = (
  address: string,
): UseQueryResult<ChicmozContractInstanceBalance, Error> => {
  return useQuery<ChicmozContractInstanceBalance, Error>({
    queryKey: queryKeyGenerator.contractInstanceBalance(address),
    queryFn: () => ContractL2API.getContractInstanceBalance(address),
  });
};

export const useContractInstanceBalanceHistory = (
  address: string,
): UseQueryResult<ChicmozContractInstanceBalance[], Error> => {
  return useQuery<ChicmozContractInstanceBalance[], Error>({
    queryKey: queryKeyGenerator.contractInstanceBalanceHistory(address),
    queryFn: () => ContractL2API.getContractInstanceBalanceHistory(address),
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

export const useContractInstancesWithAztecScanNotes = (): UseQueryResult<
  ChicmozL2ContractInstanceWithAztecScanNotes[],
  Error
> => {
  return useQuery<ChicmozL2ContractInstanceWithAztecScanNotes[], Error>({
    queryKey: queryKeyGenerator.contractInstancesWithAztecScanNotes,
    queryFn: () => ContractL2API.getContractInstancesWithAztecScanNotes(),
  });
};

export const useContractInstancesWithBalance = (): UseQueryResult<
  ChicmozContractInstanceBalance[],
  Error
> => {
  return useQuery<ChicmozContractInstanceBalance[], Error>({
    queryKey: queryKeyGenerator.contractInstancesWithBalance,
    queryFn: () => ContractL2API.getContractInstancesWithBalance(),
  });
};

export const useDeployedContractInstances = (
  classId: string,
): UseQueryResult<ChicmozL2ContractInstanceDeluxe[], Error> => {
  return useQuery<ChicmozL2ContractInstanceDeluxe[], Error>({
    queryKey: queryKeyGenerator.deployedContractInstances(classId),
    queryFn: () => ContractL2API.getContractInstancesByClassId(classId),
  });
};

const VERIFICATION_POLL_INTERVAL = 3_000;

export const useContractClassSource = (
  classId: string,
  version: string,
  enabled = true,
): UseQueryResult<ContractClassSourceResponse, Error> => {
  return useQuery<ContractClassSourceResponse, Error>({
    queryKey: queryKeyGenerator.contractClassSource(classId, version),
    queryFn: () => ContractL2API.getContractClassSource({ classId, version }),
    enabled,
  });
};

export const useVerifySourceJob = (
  classId: string,
  version: string,
  jobId: string | null,
): UseQueryResult<SourceVerificationJob, Error> => {
  return useQuery<SourceVerificationJob, Error>({
    queryKey: queryKeyGenerator.verifySourceJob(classId, version, jobId ?? ""),
    queryFn: () =>
      ContractL2API.getVerifySourceJob({
        classId,
        version,
        jobId: jobId!,
      }),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === "PENDING" ||
        status === "COMPILING" ||
        status === "VERIFYING"
      ) {
        return VERIFICATION_POLL_INTERVAL;
      }
      return false;
    },
  });
};

export const useSubmitSourceVerification = (
  classId: string,
  version: string,
): UseMutationResult<
  VerifySourceResponse,
  Error,
  {
    githubUrl: string;
    gitRef?: string;
    subPath?: string;
    aztecVersion?: string;
  }
> => {
  return useMutation<
    VerifySourceResponse,
    Error,
    {
      githubUrl: string;
      gitRef?: string;
      subPath?: string;
      aztecVersion?: string;
    }
  >({
    mutationFn: (params) =>
      ContractL2API.postVerifySource({
        classId,
        version,
        ...params,
      }),
  });
};
