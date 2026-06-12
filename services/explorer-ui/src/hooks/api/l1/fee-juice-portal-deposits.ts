import { type ChicmozL1FeeJuicePortalDeposit } from "@chicmoz-pkg/types";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { FeeJuicePortalDepositAPI } from "~/api/l1/fee-juice-portal-deposits";
import { queryKeyGenerator } from "../utils";

export const useFeeJuicePortalDepositsByAddress = (
  address: string,
): UseQueryResult<ChicmozL1FeeJuicePortalDeposit[], Error> => {
  return useQuery<ChicmozL1FeeJuicePortalDeposit[], Error>({
    queryKey: queryKeyGenerator.l1FeeJuicePortalDepositsByAddress(address),
    queryFn: () => FeeJuicePortalDepositAPI.getByAddress(address),
    enabled: !!address,
  });
};
