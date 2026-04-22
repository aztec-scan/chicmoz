import { type ChicmozL2RpcNodeError } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { RpcNodeErrorsTable } from "~/components/rpc-node-errors";
import { useChainErrors, useRpcNodes } from "~/hooks";
import { RpcNodeHealthCard } from "./rpc-node-health-card";

const getRpcNodeErrorIdentifiers = (error: ChicmozL2RpcNodeError): string[] => {
  return [error.rpcNodeName, error.rpcUrl].filter((value): value is string =>
    Boolean(value),
  );
};

export const RpcNodeHealthSection: FC = () => {
  const {
    data: allRpcNodes,
    isLoading: rpcNodesLoading,
    error: rpcNodesError,
  } = useRpcNodes();

  const {
    data: chainErrors,
    isLoading: errorsLoading,
    error: errorsError,
  } = useChainErrors();

  const rpcNodes = (allRpcNodes ?? [])
    .sort((a, b) => {
      return (
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
      );
    })
    .reduce(
      (acc: typeof allRpcNodes, rpcNode) => {
        if (acc?.some((item) => item.rpcNodeName === rpcNode.rpcNodeName)) {
          return acc;
        }
        return [...(acc ?? []), rpcNode];
      },
      [] as typeof allRpcNodes,
    );

  const getRpcNodeErrors = (rpcNodeName?: string): ChicmozL2RpcNodeError[] => {
    if (!chainErrors || !rpcNodeName) return [];

    return chainErrors.filter((error) =>
      getRpcNodeErrorIdentifiers(error).includes(rpcNodeName),
    );
  };

  const getUnmatchedErrors = (): ChicmozL2RpcNodeError[] => {
    if (!chainErrors || !rpcNodes) return [];

    const rpcNodeIdentifiers = rpcNodes
      .flatMap((rpcNode) => [rpcNode.rpcNodeName, rpcNode.rpcUrl])
      .filter((value): value is string => Boolean(value));

    return chainErrors.filter((error) => {
      const errorIdentifiers = getRpcNodeErrorIdentifiers(error);

      return !errorIdentifiers.some((identifier) =>
        rpcNodeIdentifiers.includes(identifier),
      );
    });
  };

  const unmatchedErrors = getUnmatchedErrors();

  // Loading state
  if (rpcNodesLoading || errorsLoading) {
    return (
      <div>
        <h2 className="mb-6 text-primary dark:text-white">RPC Node Health</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">
              Loading rpc node data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (rpcNodesError || errorsError) {
    return (
      <div>
        <h2 className="mb-6 text-primary dark:text-white">RPC Node Health</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <div className="font-medium">Error Loading RPC Node Data</div>
            </div>
            {rpcNodesError && (
              <div className="text-red-500 text-sm mb-2">
                RPC Nodes: {rpcNodesError.message}
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

  if (!rpcNodes || rpcNodes.length === 0) {
    return (
      <div>
        <h2 className="mb-6 text-primary dark:text-white">RPC Node Health</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <div className="font-medium">No RPC Nodes Found</div>
              <div className="text-sm">
                No rpc node data is currently available
              </div>
            </div>
          </div>
        </div>

        {unmatchedErrors.length > 0 && (
          <div className="mb-8">
            <RpcNodeErrorsTable
              title={`Unmatched Errors (${unmatchedErrors.length})`}
              rpcNodeErrors={unmatchedErrors}
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
          RPC Node Health ({rpcNodes.length})
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total Errors: {chainErrors?.length ?? 0}
        </div>
      </div>

      <div className="space-y-6">
        {rpcNodes.map((rpcNode) => {
          const rpcNodeErrors = getRpcNodeErrors(rpcNode.rpcNodeName);

          return (
            <RpcNodeHealthCard
              key={rpcNode.rpcNodeName}
              rpcNode={rpcNode}
              rpcNodeErrors={rpcNodeErrors}
            />
          );
        })}
      </div>

      {unmatchedErrors.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 dark:bg-gray-800">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-4 text-primary dark:text-white">
                Unmatched Errors
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Errors that could not be associated with any known rpc node
              </p>
            </div>
            <RpcNodeErrorsTable
              rpcNodeErrors={unmatchedErrors}
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
                All rpc nodes are operating without any reported errors
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
