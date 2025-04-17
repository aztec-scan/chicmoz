import { ChicmozL2BlockFinalizationStatus, L1L2ValidatorStatus, type ChicmozL2BlockLight, type ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import { type FC, useMemo } from "react";
import { BlockStatusBadge } from "~/components/block-status-badge";
import { NextBlockCountdown } from "~/components/next-block-countdown";
import { useAvarageBlockTime, useLatestBlocks, useSubTitle } from "~/hooks";
import { useL1L2Validators } from "~/hooks/api/l1-l2-validator";
import { routes } from "~/routes/__root";
import { Link } from "@tanstack/react-router";

// Helper function to group blocks by finalization status
const groupBlocksByFinalizationStatus = (blocks: ChicmozL2BlockLight[]) => {
  const grouped = new Map<string, ChicmozL2BlockLight>();
  
  blocks.forEach(block => {
    const status = String(block.finalizationStatus);
    
    // If we haven't seen this status or this block is newer than what we have
    if (!grouped.has(status) || 
        grouped.get(status)!.header.globalVariables.timestamp < 
        block.header.globalVariables.timestamp) {
      grouped.set(status, block);
    }
  });
  
  return Array.from(grouped.entries()).sort((a, b) => 
    a[0].localeCompare(b[0])
  );
};

export const NetworkHealth: FC = () => {
  useSubTitle("Network Health");
  
  const { data: latestBlocks, isLoading: blocksLoading, error: blocksError } = useLatestBlocks();
  const { data: avgBlockTime, isLoading: avgTimeLoading, error: avgTimeError } = useAvarageBlockTime();
  const { data: validators, isLoading: validatorsLoading, error: validatorsError } = useL1L2Validators();

  // Count validators with VALIDATING status
  const validatingCount = useMemo(() => {
    if (!validators) return 0;
    return validators.filter((v: ChicmozL1L2Validator) => v.status === L1L2ValidatorStatus.VALIDATING).length;
  }, [validators]);

  // Get total validators count
  const totalValidators = validators?.length || 0;
  
  // Group blocks by finalization status
  const blocksByStatus = useMemo(() => {
    if (!latestBlocks) return [];
    return groupBlocksByFinalizationStatus(latestBlocks);
  }, [latestBlocks]);

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">
          Network Health
        </h1>
      </div>

      {/* Block Countdown Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <h2 className="mb-4">Block Production</h2>
        <div className="flex justify-center mb-4">
          <NextBlockCountdown 
            latestBlocks={latestBlocks}
            averageBlockTime={avgBlockTime}
            isLoading={blocksLoading || avgTimeLoading}
            error={blocksError || avgTimeError}
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
              <p className="text-gray-600 dark:text-gray-400">
                {validatingCount} out of {totalValidators} validators are currently in VALIDATING status
                ({Math.round((validatingCount / totalValidators) * 100)}%)
              </p>
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
        {blocksLoading ? (
          <p>Loading blocks...</p>
        ) : blocksError ? (
          <p>Error loading blocks: {blocksError.message}</p>
        ) : blocksByStatus.length === 0 ? (
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
                {blocksByStatus.map(([status, block]) => (
                  <tr key={status} className="border-t dark:border-gray-700">
                    <td className="px-4 py-2">
                      <BlockStatusBadge status={Number(status) as ChicmozL2BlockFinalizationStatus} />
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
                      {new Date(block.header.globalVariables.timestamp).toLocaleString()}
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
