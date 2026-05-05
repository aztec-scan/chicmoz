import {
  type ChicmozL1L2Validator,
  type ChicmozL1L2ValidatorHistory,
  type ChicmozL1L2ValidatorTotals,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { L1L2ValidatorAPI } from "~/api";
import { LONG_STALE_TIME, queryKeyGenerator } from "./utils";

// The /api/l1/l2-validators route schema caps `limit` at 1000 and defaults
// to 20 when omitted. Page through at the cap so client-side
// filter/search/sort covers every validator. Stake aggregates now live on
// /totals — once the table moves to server-side q/status filtering, this
// loop can go away entirely.
const PAGE_SIZE = 1000;
const MAX_PAGES = 10; // hard stop at 10k validators to bound the loop

const fetchAllValidators = async (): Promise<ChicmozL1L2Validator[]> => {
  const all: ChicmozL1L2Validator[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await L1L2ValidatorAPI.getValidators(
      PAGE_SIZE,
      page * PAGE_SIZE,
    );
    all.push(...batch);
    if (batch.length < PAGE_SIZE) {break;}
  }
  return all;
};

export const useL1L2Validators = (): UseQueryResult<
  ChicmozL1L2Validator[],
  Error
> => {
  return useQuery<ChicmozL1L2Validator[], Error>({
    queryKey: queryKeyGenerator.l1L2Validators,
    queryFn: fetchAllValidators,
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
  ChicmozL1L2ValidatorTotals,
  Error
> => {
  return useQuery<ChicmozL1L2ValidatorTotals, Error>({
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
