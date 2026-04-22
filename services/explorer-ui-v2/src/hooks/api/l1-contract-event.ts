import { type ChicmozL1GenericContractEvent } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { L1ContractEventAPI } from "~/api";
import {
  LONG_STALE_TIME,
  REFETCH_INTERVAL,
  queryKeyGenerator,
} from "./utils";

export const useL1ContractEvents = (): UseQueryResult<
  ChicmozL1GenericContractEvent[],
  Error
> => {
  return useQuery<ChicmozL1GenericContractEvent[], Error>({
    queryKey: queryKeyGenerator.l1ContractEvents,
    queryFn: () => L1ContractEventAPI.getContractEvents(),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};
