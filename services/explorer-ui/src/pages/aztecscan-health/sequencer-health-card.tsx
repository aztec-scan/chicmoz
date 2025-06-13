import {
  type ChicmozL2RpcNodeError,
  type ChicmozL2Sequencer,
} from "@chicmoz-pkg/types";
import { type FC } from "react";
import { DeterministicStatusBadge } from "~/components/deterministic-status-badge";
import { InfoBadge } from "~/components/info-badge";
import { SequencerErrorsTable } from "~/components/sequencer-errors";
import { useReactiveTime } from "~/hooks/use-reactive-time";
import { formatTimeSince } from "~/lib/utils";

interface Props {
  sequencer: ChicmozL2Sequencer;
  sequencerErrors: ChicmozL2RpcNodeError[];
}

// Reactive time component for last seen
const LastSeenTime: FC<{ timestamp: Date }> = ({ timestamp }) => {
  useReactiveTime(1000); // Update every second to trigger re-render
  const timeString = formatTimeSince(timestamp.getTime());

  return <span>{timeString} ago</span>;
};

function simpleShortHashStr(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const SequencerHealthCard: FC<Props> = ({
  sequencer,
  sequencerErrors,
}) => {
  const sequencerName = sequencer.rpcNodeName
    ? sequencer.rpcNodeName
    : "Unknown Sequencer";
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 dark:bg-gray-800">
      {/* Sequencer Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-4 text-primary dark:text-white">
            {sequencerName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-medium">ENR Hash:</span>
              <DeterministicStatusBadge
                text={simpleShortHashStr(sequencer.enr)}
                tooltipContent={`ENR Hash: ${sequencer.enr}`}
              />
            </div>
            <div>
              <span className="font-medium">Last Seen:</span>{" "}
              <LastSeenTime timestamp={new Date(sequencer.lastSeenAt)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Node Version:</span>
              <DeterministicStatusBadge
                text={sequencer.nodeVersion}
                tooltipContent={`Node Version: ${sequencer.nodeVersion}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Rollup Version:</span>
              <DeterministicStatusBadge
                text={sequencer.rollupVersion.toString()}
                tooltipContent={`Rollup Version: ${sequencer.rollupVersion.toString()}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Statistics InfoBadges */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4 md:gap-5">
        <InfoBadge
          title="Total Errors"
          data={sequencerErrors.length.toString()}
          isLoading={false}
          error={null}
        />
        <InfoBadge
          title="Recent Errors (1h)"
          data={sequencerErrors
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
          data={sequencerErrors
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
          data={sequencerErrors
            .reduce((sum, error) => sum + error.count, 0)
            .toString()}
          isLoading={false}
          error={null}
        />
      </div>

      {/* Errors Table */}
      {sequencerErrors.length > 0 && (
        <SequencerErrorsTable
          title={`Sequencer Errors (${sequencerErrors.length})`}
          sequencerErrors={sequencerErrors}
          isLoading={false}
          error={null}
          disableSizeSelector={true}
          disablePagination={sequencerErrors.length <= 10}
          maxEntries={10}
        />
      )}

      {sequencerErrors.length === 0 && (
        <div className="text-center py-8 text-green-600 dark:text-green-400">
          <div className="font-medium">No Errors Detected</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            This sequencer is operating without any reported errors
          </div>
        </div>
      )}
    </div>
  );
};
