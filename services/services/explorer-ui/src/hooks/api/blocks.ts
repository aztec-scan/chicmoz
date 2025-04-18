import { ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { useQuery } from "@tanstack/react-query";
import { queryGetBlocksByStatus } from "~/lib/api-client";
import { REFETCH_INTERVAL_MS } from "~/lib/refetch-intervals";

/**
 * Hook to fetch one block for each finalization status
 */
export const useBlocksByFinalizationStatus = () => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: ["blocks", "by-status"],
    queryFn: async () => {
      const data = await queryGetBlocksByStatus();
      return data;
    },
    refetchInterval: REFETCH_INTERVAL_MS,
  });
};
