import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { BlockStatusBadge } from "~/components/block-status-badge";
import { Loader } from "~/components/loader";
import { useBlocksByFinalizationStatus } from "~/hooks/api/blocks";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";
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

  // Ensure we have an entry for each possible detailed status value
  const blocksWithStatuses = useMemo<BlockWithStatuses[]>(() => {
    if (!blocksByFinalizationStatus) {
      return [];
    }

    // Define all possible status values based on ChicmozL2BlockFinalizationStatus enum
    const allPossibleStatuses = [0, 1, 2, 3, 4, 5];

    // Sort all blocks by status (highest first), then by height (descending)
    const sortedBlocks = [...blocksByFinalizationStatus].sort((a, b) => {
      const statusDiff =
        Number(b.finalizationStatus) - Number(a.finalizationStatus);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return Number(b.height) - Number(a.height);
    });

    // Create result array with exactly one entry for each possible status
    const result: BlockWithStatuses[] = [];

    // For each possible status, find the best block to represent it
    for (const statusValue of allPossibleStatuses) {
      // Find the block with the exact status value, or the highest status block
      // that can represent this status
      const bestBlock =
        sortedBlocks.find(
          (block) => Number(block.finalizationStatus) === statusValue,
        ) ?? sortedBlocks[0]; // Fallback to highest block if none found

      if (bestBlock) {
        result.push({
          block: bestBlock,
          statuses: [statusValue],
        });
      }
    }

    // Sort by status (highest first)
    result.sort((a, b) => b.statuses[0] - a.statuses[0]);

    return result;
  }, [blocksByFinalizationStatus]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Latest Blocks by Finalization Status</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Currently we are refactoring so that we will have fewer, less
        complicated statuses. In the meantime, the UI is displaying the new
        simpler statuses, except for this table, where we are showing both. It
        also becomes painfully clear that the detailed status does not have the
        correct ordering of finalization.
      </p>
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
                  <tr
                    key={`${block.hash}-${status}`}
                    className="border-t dark:border-gray-700"
                  >
                    <td className="px-4 py-2">
                      <BlockStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-2">
                      <BlockStatusBadge
                        status={status}
                        useSimplifiedStatuses={false}
                      />
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
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
