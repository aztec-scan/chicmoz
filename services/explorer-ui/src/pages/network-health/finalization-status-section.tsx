import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { BlockStatusBadge } from "~/components/block-status-badge";
import { Loader } from "~/components/loader";
import { useBlocksByFinalizationStatus } from "~/hooks/api/blocks";
import { routes } from "~/routes/__root";
import { truncateHashString } from "~/lib/create-hash-string";
import { type BlockWithStatuses } from "./types";

export const FinalizationStatusSection: FC = () => {
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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Latest Blocks by Finalization Status</h2>
      {blocksByStatusLoading ? (
        <Loader amount={5} />
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
                <th className="px-4 py-2 text-left">Detailed Status</th>
                <th className="px-4 py-2 text-left">Block Height</th>
                <th className="px-4 py-2 text-left">Block Hash</th>
                <th className="px-4 py-2 text-left">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {blocksWithStatuses.flatMap(({ block, statuses }) => 
                statuses.map((status) => (
                  <tr key={`${block.hash}-${status}`} className="border-t dark:border-gray-700">
                    <td className="px-4 py-2">
                      <BlockStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-2">
                      <BlockStatusBadge status={status} useSimplifiedStatuses={false} />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`${routes.blocks.route}/${block.height}`}
                        className="text-purple-light hover:underline"
                      >
                        {String(block.height)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`${routes.blocks.route}/${block.hash}`}
                        className="text-purple-light font-mono text-xs"
                      >
                        {truncateHashString(block.hash)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(
                        block.header.globalVariables.timestamp,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
