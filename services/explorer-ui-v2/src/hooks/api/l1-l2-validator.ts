import {
  type ChicmozL1L2Validator,
  type ChicmozL1L2ValidatorHistory,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { L1L2ValidatorAPI } from "~/api";
import { LONG_STALE_TIME, queryKeyGenerator } from "./utils";

export const useL1L2Validators = (): UseQueryResult<
  ChicmozL1L2Validator[],
  Error
> => {
  return useQuery<ChicmozL1L2Validator[], Error>({
    queryKey: queryKeyGenerator.l1L2Validators,
    queryFn: () => L1L2ValidatorAPI.getValidators(),
    staleTime: LONG_STALE_TIME,
  });
};

export const useL1L2Validator = (
  address: string,
): UseQueryResult<ChicmozL1L2Validator, Error> => {
  return useQuery<ChicmozL1L2Validator, Error>({
    queryKey: queryKeyGenerator.l1L2Validator(address),
    queryFn: () => L1L2ValidatorAPI.getValidatorByAddress(address),
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });
};

export const useL1L2ValidatorHistory = (
  address: string | undefined,
): UseQueryResult<ChicmozL1L2ValidatorHistory, Error> => {
  return useQuery<ChicmozL1L2ValidatorHistory, Error>({
    queryKey: queryKeyGenerator.l1L2ValidatorHistory(address ?? ""),
    queryFn: () =>
      address
        ? L1L2ValidatorAPI.getValidatorHistory(address)
        : Promise.resolve([]),
    enabled: !!address,
    // History is append-only, so an old cached copy is almost always OK.
    staleTime: 5 * 60_000,
  });
};

export const useValidatorTotals = (): UseQueryResult<
  { validating: number; nonValidating: number },
  Error
> => {
  return useQuery<{ validating: number; nonValidating: number }, Error>({
    queryKey: queryKeyGenerator.l1L2ValidatorTotals,
    queryFn: () => L1L2ValidatorAPI.getValidatorTotals(),
    staleTime: LONG_STALE_TIME,
  });
};

export const usePaginatedValidators = (
  page = 0,
  pageSize = 20,
): UseQueryResult<ChicmozL1L2Validator[], Error> => {
  return useQuery<ChicmozL1L2Validator[], Error>({
    queryKey: queryKeyGenerator.paginatedValidators(page, pageSize),
    queryFn: () => {
      const offset = page * pageSize;
      return L1L2ValidatorAPI.getValidators(pageSize, offset);
    },
    staleTime: LONG_STALE_TIME,
    gcTime: 5 * 60 * 1000,
  });
};
