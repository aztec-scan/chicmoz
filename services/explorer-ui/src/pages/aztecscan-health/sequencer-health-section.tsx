import { type FC } from "react";
import { type ChicmozL2RpcNodeError } from "@chicmoz-pkg/types";
import { useChainErrors, useSequencers } from "~/hooks";
import { SequencerHealthCard } from "./sequencer-health-card";
import { SequencerErrorsTable } from "~/components/sequencer-errors";

export const SequencerHealthSection: FC = () => {
  const { 
    data: sequencers, 
    isLoading: sequencersLoading, 
    error: sequencersError 
  } = useSequencers();
  
  const { 
    data: chainErrors, 
    isLoading: errorsLoading, 
    error: errorsError 
  } = useChainErrors();

  // Function to get errors for a specific sequencer
  const getSequencerErrors = (sequencerRpcUrl?: string): ChicmozL2RpcNodeError[] => {
    if (!chainErrors || !sequencerRpcUrl) return [];
    
    return chainErrors.filter(
      error => error.rpcUrl === sequencerRpcUrl || error.nodeName === sequencerRpcUrl
    );
  };

  // Function to get errors that don't match any sequencer
  const getUnmatchedErrors = (): ChicmozL2RpcNodeError[] => {
    if (!chainErrors || !sequencers) return [];
    
    const sequencerRpcUrls = sequencers.map(s => s.rpcUrl).filter(Boolean);
    
    return chainErrors.filter(error => {
      // Error is unmatched if its rpcUrl or nodeName doesn't match any sequencer's rpcUrl
      const errorIdentifiers = [error.rpcUrl, error.nodeName].filter(Boolean);
      
      return !errorIdentifiers.some(identifier => 
        sequencerRpcUrls.includes(identifier)
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
            <div className="text-gray-600 dark:text-gray-400">Loading sequencer data...</div>
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
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.762 0L3.052 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
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
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09M6.343 6.343A8 8 0 1017.657 17.657 8 8 0 106.343 6.343z" />
              </svg>
              <div className="font-medium">No Sequencers Found</div>
              <div className="text-sm">No sequencer data is currently available</div>
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
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-primary dark:text-white">
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
      )}

      {/* Show message when no errors at all */}
      {(!chainErrors || chainErrors.length === 0) && (
        <div className="mt-8 text-center py-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <div className="text-green-600 dark:text-green-400">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium">No Errors Detected</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              All sequencers are operating without any reported errors
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
