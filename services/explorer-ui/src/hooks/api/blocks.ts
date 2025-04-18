import { ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { useQuery } from "@tanstack/react-query";
import { BlockAPI } from "~/api/block";
import { REFETCH_INTERVAL } from "./utils";

/**
 * Hook to fetch one block for each finalization status
 */
export const useBlocksByFinalizationStatus = () => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: ["blocks", "by-status"],
    queryFn: async () => {
      const data = await BlockAPI.getBlocksByStatus();
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
};
