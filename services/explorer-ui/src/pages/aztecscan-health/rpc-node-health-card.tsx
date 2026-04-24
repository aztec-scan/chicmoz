import {
  type ChicmozL2RpcNodeError,
  type PublicChicmozL2RpcNode,
} from "@chicmoz-pkg/types";
import { type FC } from "react";
import { DeterministicStatusBadge } from "~/components/deterministic-status-badge";
import { InfoBadge } from "~/components/info-badge";
import { RpcNodeErrorsTable } from "~/components/rpc-node-errors";
import { useReactiveTime } from "~/hooks/use-reactive-time";
import { formatTimeSince } from "~/lib/utils";

interface Props {
  rpcNode: PublicChicmozL2RpcNode;
  rpcNodeErrors: ChicmozL2RpcNodeError[];
}

// Reactive time component for last seen
const LastSeenTime: FC<{ timestamp: Date }> = ({ timestamp }) => {
  useReactiveTime(1000); // Update every second to trigger re-render
  const timeString = formatTimeSince(timestamp.getTime());

  return <span>{timeString} ago</span>;
};

export const RpcNodeHealthCard: FC<Props> = ({ rpcNode, rpcNodeErrors }) => {
  const rpcNodeName = rpcNode.rpcNodeName;
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 dark:bg-gray-800">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-4 text-primary dark:text-white">
            {rpcNodeName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Last Seen:</span>{" "}
              <LastSeenTime timestamp={new Date(rpcNode.lastSeenAt)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Node Version:</span>
              <DeterministicStatusBadge
                text={rpcNode.nodeVersion}
                tooltipContent={`Node Version: ${rpcNode.nodeVersion}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Rollup Version:</span>
              <DeterministicStatusBadge
                text={rpcNode.rollupVersion.toString()}
                tooltipContent={`Rollup Version: ${rpcNode.rollupVersion.toString()}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4 md:gap-5">
        <InfoBadge
          title="Total Errors"
          data={rpcNodeErrors.length.toString()}
          isLoading={false}
          error={null}
        />
        <InfoBadge
          title="Recent Errors (1h)"
          data={rpcNodeErrors
            .filter(
              (error) =>
                new Date(error.lastSeenAt).getTime() >
                Date.now() - 60 * 60 * 1000,
            )
            .length.toString()}
          isLoading={false}
          error={null}
        />
        <InfoBadge
          title="Critical Errors (5m)"
          data={rpcNodeErrors
            .filter(
              (error) =>
                new Date(error.lastSeenAt).getTime() >
                Date.now() - 5 * 60 * 1000,
            )
            .length.toString()}
          isLoading={false}
          error={null}
        />
        <InfoBadge
          title="Total Occurrences"
          data={rpcNodeErrors
            .reduce((sum, error) => sum + error.count, 0)
            .toString()}
          isLoading={false}
          error={null}
        />
      </div>

      {rpcNodeErrors.length > 0 && (
        <RpcNodeErrorsTable
          title={`RPC Node Errors (${rpcNodeErrors.length})`}
          rpcNodeErrors={rpcNodeErrors}
          isLoading={false}
          error={null}
          disableSizeSelector={true}
          disablePagination={rpcNodeErrors.length <= 10}
          maxEntries={10}
        />
      )}

      {rpcNodeErrors.length === 0 && (
        <div className="text-center py-8 text-green-600 dark:text-green-400">
          <div className="font-medium">No Errors Detected</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            This rpc node is operating without any reported errors
          </div>
        </div>
      )}
    </div>
  );
};
