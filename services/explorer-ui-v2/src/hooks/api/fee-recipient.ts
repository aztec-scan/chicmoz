import { type ChicmozFeeRecipient } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { FeeRecipientAPI } from "~/api";
import { LONG_STALE_TIME, queryKeyGenerator } from "./utils";

export const useFeeRecipients = (): UseQueryResult<
  ChicmozFeeRecipient[],
  Error
> => {
  return useQuery<ChicmozFeeRecipient[], Error>({
    queryKey: queryKeyGenerator.feeRecipients,
    queryFn: () => FeeRecipientAPI.getFeeRecipients(),
    retry: false,
    staleTime: LONG_STALE_TIME,
  });
};
