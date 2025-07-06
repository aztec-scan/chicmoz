import { type ChicmozL2RpcNodeError } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { SequencerErrorsTable } from "~/components/sequencer-errors";
import { useChainErrors, useSequencers } from "~/hooks";
import { SequencerHealthCard } from "./sequencer-health-card";

export const SequencerHealthSection: FC = () => {
  const {
    data: allSequencers,
    isLoading: sequencersLoading,
    error: sequencersError,
  } = useSequencers();

  const {
    data: chainErrors,
    isLoading: errorsLoading,
    error: errorsError,
  } = useChainErrors();

  const sequencers = allSequencers?.sort((a, b) => {
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
  }).reduce((acc, sequencer) => {
    if (acc.some((s) => s.rpcUrl === sequencer.rpcUrl)) {
      return acc;
    }
    return [...acc, sequencer];
  }, [] as typeof allSequencers);

  // Function to get errors for a specific sequencer
  const getSequencerErrors = (
    sequencerRpcUrl?: string,
  ): ChicmozL2RpcNodeError[] => {
    if (!chainErrors || !sequencerRpcUrl) return [];

    return chainErrors.filter(
      (error) =>
        error.rpcUrl === sequencerRpcUrl || error.nodeName === sequencerRpcUrl,
    );
  };

  // Function to get errors that don't match any sequencer
  const getUnmatchedErrors = (): ChicmozL2RpcNodeError[] => {
    if (!chainErrors || !sequencers) return [];

    const sequencerRpcUrls = sequencers.map((s) => s.rpcUrl).filter(Boolean);

    return chainErrors.filter((error) => {
      // Error is unmatched if its rpcUrl or nodeName doesn't match any sequencer's rpcUrl
      const errorIdentifiers = [error.rpcUrl, error.nodeName].filter(Boolean);

      return !errorIdentifiers.some((identifier) =>
        sequencerRpcUrls.includes(identifier),
      );
    });
  };

  const unmatchedErrors = getUnmatchedErrors();

  // Loading state
  if (sequencersLoading || errorsLoading) {
    return (
      <div>
        <h2 className="mb-6 text-primary dark:text-white">Sequencer Health</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">
              Loading sequencer data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (sequencersError || errorsError) {
    return (
      <div>
        <h2 className="mb-6 text-primary dark:text-white">Sequencer Health</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <div className="font-medium">Error Loading Sequencer Data</div>
            </div>
            {sequencersError && (
              <div className="text-red-500 text-sm mb-2">
                Sequencers: {sequencersError.message}
              </div>
            )}
            {errorsError && (
              <div className="text-red-500 text-sm">
                Chain Errors: {errorsError.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No sequencers found
  if (!sequencers || sequencers.length === 0) {
    return (
      <div>
        <h2 className="mb-6 text-primary dark:text-white">Sequencer Health</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <div className="font-medium">No Sequencers Found</div>
              <div className="text-sm">
                No sequencer data is currently available
              </div>
            </div>
          </div>
        </div>

        {/* Show unmatched errors even when no sequencers */}
        {unmatchedErrors.length > 0 && (
          <div className="mb-8">
            <SequencerErrorsTable
              title={`Unmatched Errors (${unmatchedErrors.length})`}
              sequencerErrors={unmatchedErrors}
              isLoading={false}
              error={null}
              disableSizeSelector={true}
              disablePagination={unmatchedErrors.length <= 10}
              maxEntries={20}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-primary dark:text-white">
          Sequencer Health ({sequencers.length})
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total Errors: {chainErrors?.length ?? 0}
        </div>
      </div>

      <div className="space-y-6">
        {sequencers.map((sequencer) => {
          const sequencerErrors = getSequencerErrors(sequencer.rpcUrl);

          return (
            <SequencerHealthCard
              key={sequencer.enr}
              sequencer={sequencer}
              sequencerErrors={sequencerErrors}
            />
          );
        })}
      </div>

      {/* Unmatched Errors Section */}
      {unmatchedErrors.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 dark:bg-gray-800">
          {/* Sequencer Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-4 text-primary dark:text-white">
                Unmatched Errors
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Errors that could not be associated with any known sequencer
              </p>
            </div>
            <SequencerErrorsTable
              sequencerErrors={unmatchedErrors}
              isLoading={false}
              error={null}
              disableSizeSelector={true}
              disablePagination={unmatchedErrors.length <= 10}
              maxEntries={20}
            />
          </div>
        </div>
      )}

      {/* Show message when no errors at all */}
      {(!chainErrors || chainErrors.length === 0) && (
        <div className="mt-8 p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <h3 className="text-lg font-medium text-primary dark:text-white">
            Unmatched Errors
          </h3>
          <div className="mt-8 text-center">
            <div className="mb-4"></div>
            <div className="text-green-600 dark:text-green-400">
              <div className="font-medium">No Errors Detected</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                All sequencers are operating without any reported errors
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
