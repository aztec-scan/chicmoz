import { ChicmozL1L2ValidatorHistory, type ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { L1L2ValidatorAPI } from "~/api/l1-l2-validator";
import { queryKeyGenerator } from "./utils";

export const useL1L2Validators = (): UseQueryResult<
  ChicmozL1L2Validator[],
  Error
> => {
  return useQuery<ChicmozL1L2Validator[], Error>({
    queryKey: queryKeyGenerator.l1L2Validators,
    queryFn: () => L1L2ValidatorAPI.getValidators(),
  });
};

export const useL1L2Validator = (
  address: string
): UseQueryResult<ChicmozL1L2Validator, Error> => {
  return useQuery<ChicmozL1L2Validator, Error>({
    queryKey: queryKeyGenerator.l1L2Validator(address),
    queryFn: () => L1L2ValidatorAPI.getValidatorByAddress(address),
  });
};

export const useL1L2ValidatorHistory = (
  address: string | undefined
): UseQueryResult<ChicmozL1L2ValidatorHistory, Error> => {
  return useQuery<ChicmozL1L2ValidatorHistory, Error>({
    queryKey: queryKeyGenerator.l1L2ValidatorHistory(address ?? ""),
    queryFn: () =>
      address
        ? L1L2ValidatorAPI.getValidatorHistory(address)
        : Promise.resolve([]),
  });
};
