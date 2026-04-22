import { type ChicmozL2Sequencer } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { SequencerAPI } from "~/api";
import {
  LONG_STALE_TIME,
  SLOW_REFETCH_INTERVAL,
  queryKeyGenerator,
} from "./utils";

export const useSequencers = (): UseQueryResult<
  ChicmozL2Sequencer[],
  Error
> => {
  return useQuery<ChicmozL2Sequencer[], Error>({
    queryKey: queryKeyGenerator.sequencers,
    queryFn: () => SequencerAPI.getAllSequencers(),
    refetchInterval: SLOW_REFETCH_INTERVAL,
    staleTime: LONG_STALE_TIME,
  });
};
