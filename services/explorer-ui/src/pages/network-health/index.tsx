import {
  L1L2ValidatorStatus,
  type ChicmozL2BlockFinalizationStatus,
  type ChicmozL2BlockLight,
} from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { BlockCountdownProgress } from "~/components/block-countdown-progress";
import { BlockStatusBadge } from "~/components/block-status-badge";
import { useAvarageBlockTime, useLatestBlocks, useSubTitle } from "~/hooks";
import { useBlocksByFinalizationStatus } from "~/hooks/api/blocks";
import { useL1L2Validators } from "~/hooks/api/l1-l2-validator";
import { routes } from "~/routes/__root";

// Define a type for our transformed data structure
interface BlockWithStatuses {
  block: ChicmozL2BlockLight;
  statuses: number[];
}

export const NetworkHealth: FC = () => {
  useSubTitle("Network Health");

  const { data: latestBlocks } = useLatestBlocks();
  const { data: avgBlockTime } = useAvarageBlockTime();
  const {
    data: validators,
    isLoading: validatorsLoading,
    error: validatorsError,
  } = useL1L2Validators();
  const {
    data: blocksByFinalizationStatus,
    isLoading: blocksByStatusLoading,
    error: blocksByStatusError,
  } = useBlocksByFinalizationStatus();

  if (blocksByStatusError) {
    console.error(
      "Error fetching blocks by finalization status:",
      blocksByStatusError,
    );
  }

  // Count validators for each status
  const validatorStatusCounts = useMemo(() => {
    if (!validators) {
      return [];
    }

    // Create a map to store counts for each status
    const counts = new Map<number, number>();

    // Count validators for each status
    validators.forEach((validator) => {
      const status = validator.status;
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });

    // Convert to array of [status, count] pairs
    return Array.from(counts.entries()).sort(
      ([statusA], [statusB]) => statusA - statusB,
    ); // Sort by status
  }, [validators]);

  // Get total validators count
  const totalValidators = validators?.length ?? 0;

  // Transform blocks and assign multiple statuses to each block
  const blocksWithStatuses = useMemo<BlockWithStatuses[]>(() => {
    if (!blocksByFinalizationStatus) {
      return [];
    }

    // Get unique blocks by hash
    const uniqueBlocksMap = new Map<string, ChicmozL2BlockLight>();
    for (const block of blocksByFinalizationStatus) {
      uniqueBlocksMap.set(block.hash, block);
    }

    // Convert to array and sort by status (highest first), then by height (descending)
    const uniqueBlocks = Array.from(uniqueBlocksMap.values()).sort((a, b) => {
      const statusDiff =
        Number(b.finalizationStatus) - Number(a.finalizationStatus);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return Number(b.height) - Number(a.height); // Secondary sort by height (descending)
    });

    // For each block, determine which statuses it should represent
    const result: BlockWithStatuses[] = [];

    for (let i = 0; i < uniqueBlocks.length; i++) {
      const block = uniqueBlocks[i];
      const currentStatus = Number(block.finalizationStatus);

      // Determine the lowest status this block should represent
      let lowestStatus = 0;
      if (i < uniqueBlocks.length - 1) {
        // Find the next block with a different status
        let nextIndex = i + 1;
        while (
          nextIndex < uniqueBlocks.length &&
          Number(uniqueBlocks[nextIndex].finalizationStatus) === currentStatus
        ) {
          nextIndex++;
        }

        if (nextIndex < uniqueBlocks.length) {
          lowestStatus = Number(uniqueBlocks[nextIndex].finalizationStatus) + 1;
        }
      }

      // Create array of statuses for this block
      const statuses: number[] = [];
      for (let status = currentStatus; status >= lowestStatus; status--) {
        statuses.push(status);
      }

      result.push({ block, statuses });
    }

    return result;
  }, [blocksByFinalizationStatus]);

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">Network Health</h1>
      </div>

      {/* Block Countdown Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <h2 className="mb-4">Block Production</h2>
        <div className="flex justify-center mb-4">
          <BlockCountdownProgress
            latestBlocks={latestBlocks}
            averageBlockTime={avgBlockTime}
          />
        </div>
      </div>

      {/* Validators Status Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <h2 className="mb-4">Validators Status</h2>
        {validatorsLoading ? (
          <p>Loading validators...</p>
        ) : validatorsError ? (
          <p>Error loading validators: {validatorsError.message}</p>
        ) : (
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Validator Summary</h3>
              {totalValidators > 0 ? (
                <div className="space-y-2">
                  {validatorStatusCounts.map(([status, count]) => {
                    // Get status name from enum - this works because TypeScript numeric enums
                    // are bidirectional (value to name mapping is also available)
                    const statusName =
                      L1L2ValidatorStatus[status] || `Status ${status}`;
                    const percentage = Math.round(
                      (count / totalValidators) * 100,
                    );

                    return (
                      <p
                        key={status}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {count} out of {totalValidators} validators (
                        {percentage}%) are in {statusName} status
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No validators found
                </p>
              )}
            </div>
            <Link
              to={routes.validators.route}
              className="text-purple-light hover:underline self-end"
            >
              View all validators →
            </Link>
          </div>
        )}
      </div>

      {/* Finalization Status Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <h2 className="mb-4">Latest Blocks by Finalization Status</h2>
        {blocksByStatusLoading ? (
          <p>Loading blocks...</p>
        ) : blocksByStatusError ? (
          <p>Error loading blocks: {blocksByStatusError.message}</p>
        ) : blocksWithStatuses.length === 0 ? (
          <p>No blocks available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Finalization Status</th>
                  <th className="px-4 py-2 text-left">Block Height</th>
                  <th className="px-4 py-2 text-left">Block Hash</th>
                  <th className="px-4 py-2 text-left">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {blocksWithStatuses.map(({ block, statuses }) => (
                  <tr
                    key={block.hash}
                    className="border-t dark:border-gray-700"
                  >
                    <td className="px-4 py-2 flex flex-wrap gap-1">
                      {statuses.map((status) => (
                        <BlockStatusBadge
                          key={status}
                          status={status as ChicmozL2BlockFinalizationStatus}
                        />
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`${routes.blocks.route}/${block.height}`}
                        className="text-purple-light hover:underline"
                      >
                        {String(block.height)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs truncate max-w-[150px]">
                      {block.hash}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(
                        block.header.globalVariables.timestamp,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
