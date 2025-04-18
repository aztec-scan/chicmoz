import { type ChicmozReorg } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { Loader } from "~/components/loader";
import { useReorgs } from "~/hooks/api/blocks";
import { routes } from "~/routes/__root";

export const ReorgSection: FC = () => {
  const {
    data: reorgs,
    isLoading: reorgsLoading,
    error: reorgsError,
  } = useReorgs();

  if (reorgsError) {
    console.error("Error fetching reorgs:", reorgsError);
  }

  // Filter reorgs in the past 24 hours
  const recentReorgs = useMemo(() => {
    if (!reorgs) return [];

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return reorgs.filter((reorg: ChicmozReorg) => {
      const reorgTimestamp = new Date(reorg.timestamp);
      return reorgTimestamp >= oneDayAgo;
    });
  }, [reorgs]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Recent Chain Reorgs (very much WIP)</h2>
      {reorgsLoading ? (
        <Loader amount={10} />
      ) : reorgsError ? (
        <div>
          <p className="text-yellow-600 dark:text-yellow-400 mb-2">
            Development Mode: Reorg API not available
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The reorg endpoint is configured but not yet available in your
            development environment. This section will automatically work when
            the API endpoint is deployed.
          </p>
        </div>
      ) : recentReorgs.length === 0 ? (
        <p className="text-green-600 dark:text-green-400 font-semibold">
          No chain reorganizations in the past 24 hours - Network is stable! 🎉
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Height</th>
                <th className="px-4 py-2 text-left">Orphaned Block</th>
                <th className="px-4 py-2 text-left">Total Orphaned Blocks</th>
              </tr>
            </thead>
            <tbody>
              {recentReorgs.map((reorg: ChicmozReorg) => (
                <tr
                  key={reorg.orphanedBlockHash}
                  className="border-t dark:border-gray-700"
                >
                  <td className="px-4 py-2">
                    {new Date(reorg.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`${routes.blocks.route}/${reorg.height}`}
                      className="text-purple-light hover:underline"
                    >
                      {String(reorg.height)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs truncate max-w-[150px]">
                    <Link
                      to={`${routes.blocks.route}/${reorg.orphanedBlockHash}`}
                      className="text-purple-light hover:underline"
                    >
                      {reorg.orphanedBlockHash}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 py-1 px-2 rounded">
                      {reorg.nbrOfOrphanedBlocks}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recentReorgs.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Displaying last 24 hours
            <br />
            <span className="font-semibold">Note:</span> Chain reorganizations
            occur when a new chain with a higher priority replaces an existing
            chain. This can happen due to network latency, validator
            disagreements, or other factors.
          </p>
        </div>
      )}
    </div>
  );
};
