import { type ChicmozL1FeeJuicePortalDeposit } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { L1FeeJuicePortalDepositAPI } from "~/api";
import { LONG_STALE_TIME, REFETCH_INTERVAL, queryKeyGenerator } from "./utils";

export const useL1FeeJuicePortalDepositsByAddress = (
  address: string,
): UseQueryResult<ChicmozL1FeeJuicePortalDeposit[], Error> => {
  return useQuery<ChicmozL1FeeJuicePortalDeposit[], Error>({
    queryKey: queryKeyGenerator.l1FeeJuicePortalDepositsByAddress(address),
    queryFn: () => L1FeeJuicePortalDepositAPI.getByAddress(address),
    enabled: !!address,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};
