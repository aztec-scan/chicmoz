import { type ChicmozL2TipsHealth } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { TipsAPI } from "~/api/tips";
import { LIVE_REFETCH_INTERVAL, queryKeyGenerator } from "./utils";

export const useL2TipsHealth = (): UseQueryResult<
  ChicmozL2TipsHealth,
  Error
> => {
  return useQuery<ChicmozL2TipsHealth, Error>({
    queryKey: queryKeyGenerator.l2TipsHealth,
    queryFn: TipsAPI.getL2TipsHealth,
    refetchInterval: LIVE_REFETCH_INTERVAL,
    retry: false,
  });
};
