import { type ChicmozL2ContractInstanceDeployerMetadata } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { VerifiedContractInstanceL2API } from "~/api";
import { queryKeyGenerator } from "./utils";

export const useVerifiedContractInstances = (): UseQueryResult<
  ChicmozL2ContractInstanceDeployerMetadata[],
  Error
> => {
  return useQuery<ChicmozL2ContractInstanceDeployerMetadata[], Error>({
    queryKey: queryKeyGenerator.verifiedContracts,
    queryFn: VerifiedContractInstanceL2API.getVerifiedContracts,
  });
};
