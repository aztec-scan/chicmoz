import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { BlockStatusBadge } from "~/components/block-status-badge";
import { Loader } from "~/components/loader";
import { useBlocksByFinalizationStatus } from "~/hooks/api/blocks";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";
import { type BlockWithStatuses } from "./types";
import { type ChicmozL2NativeBlockStatus } from "@chicmoz-pkg/types";

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

  const blocksWithStatuses = useMemo<BlockWithStatuses[]>(() => {
    if (!blocksByFinalizationStatus) {
      return [];
    }

    const allPossibleStatuses: ChicmozL2NativeBlockStatus[] = [
      "finalized",
      "proven",
      "checkpointed",
      "proposed",
      "unknown",
    ];

    const sortedBlocks = [...blocksByFinalizationStatus].sort((a, b) => {
      if (b.height === a.height) {
        return 0;
      }
      return b.height > a.height ? 1 : -1;
    });

    const result: BlockWithStatuses[] = [];

    for (const statusValue of allPossibleStatuses) {
      const bestBlock = sortedBlocks.find(
        (block) => (block.nativeStatus ?? "unknown") === statusValue,
      );

      if (bestBlock) {
        result.push({
          block: bestBlock,
          statuses: [statusValue],
        });
      }
    }

    return result;
  }, [blocksByFinalizationStatus]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Latest Blocks by Native Status</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Statuses are derived from Aztec native L2 tips. L1 proposal and proof
        events remain available as factual metadata on block detail pages.
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
                <th className="px-4 py-2 text-left">Native Status</th>
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
                      <BlockStatusBadge nativeStatus={status} />
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
