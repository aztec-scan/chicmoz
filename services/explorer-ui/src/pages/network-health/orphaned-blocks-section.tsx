import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { Loader } from "~/components/loader";
import { useOrphanedBlocksLimited } from "~/hooks/api/blocks";
import { routes } from "~/routes/__root";

export const OrphanedBlocksSection: FC = () => {
  const {
    data: orphanedBlocks,
    isLoading: orphanedBlocksLoading,
    error: orphanedBlocksError,
  } = useOrphanedBlocksLimited();

  if (orphanedBlocksError) {
    console.error("Error fetching orphaned blocks:", orphanedBlocksError);
  }

  const recentOrphanedBlocks = useMemo(() => {
    if (!orphanedBlocks) return [];
    return orphanedBlocks.slice(0, 15);
  }, [orphanedBlocks]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Recent Orphaned Blocks</h2>
      {orphanedBlocksLoading ? (
        <Loader amount={15} />
      ) : orphanedBlocksError ? (
        <div>
          <p className="text-yellow-600 dark:text-yellow-400 mb-2">
            Error fetching orphaned blocks: {orphanedBlocksError.message}
          </p>
        </div>
      ) : recentOrphanedBlocks.length === 0 ? (
        <p className="text-green-600 dark:text-green-400 font-semibold">
          No orphaned blocks found
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Height</th>
                <th className="px-4 py-2 text-left">Block Hash</th>
                <th className="px-4 py-2 text-left">Orphaned Time</th>
                <th className="px-4 py-2 text-left">Has Orphaned Parent</th>
              </tr>
            </thead>
            <tbody>
              {recentOrphanedBlocks.map((block: ChicmozL2BlockLight) => (
                <tr key={block.hash} className="border-t dark:border-gray-700">
                  <td className="px-4 py-2">{String(block.height)}</td>
                  <td className="px-4 py-2 font-mono text-xs truncate max-w-[200px]">
                    <Link
                      to={`${routes.blocks.route}/${block.hash}`}
                      className="text-purple-light hover:underline"
                    >
                      {block.hash}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {block.orphan?.timestamp
                      ? new Date(block.orphan.timestamp).toLocaleString()
                      : "Unknown"}
                  </td>
                  <td className="px-4 py-2">
                    {block.orphan?.hasOrphanedParent ? (
                      <span className="text-red-500">Yes</span>
                    ) : (
                      <span className="text-blue-500">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recentOrphanedBlocks.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Displaying last 10 orphaned blocks
            <br />
            <span className="font-semibold">Note:</span> Orphaned blocks are
            blocks that were initially accepted but later replaced by blocks in
            a longer chain. "Has Orphaned Parent" indicates whether this block
            is part of a longer chain of orphaned blocks.
          </p>
        </div>
      )}
    </div>
  );
};
