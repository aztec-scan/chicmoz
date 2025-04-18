import { ChicmozL2BlockLight, ChicmozReorg } from "@chicmoz-pkg/types";
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

/**
 * Hook to fetch orphaned blocks
 */
export const useOrphanedBlocks = () => {
  return useQuery<ChicmozL2BlockLight[], Error>({
    queryKey: ["blocks", "orphaned"],
    queryFn: async () => {
      const data = await BlockAPI.getOrphanedBlocks();
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
};

/**
 * Hook to fetch reorgs
 */
export const useReorgs = () => {
  return useQuery<ChicmozReorg[], Error>({
    queryKey: ["reorgs"],
    queryFn: async () => {
      try {
        const data = await BlockAPI.getReorgs();
        return data;
      } catch (error) {
        console.warn("Reorg API endpoint not available yet:", error);
        // Return empty array to prevent errors in development
        return [];
      }
    },
    refetchInterval: REFETCH_INTERVAL,
    // Don't retry too aggressively in development
    retry: false
  });
};
