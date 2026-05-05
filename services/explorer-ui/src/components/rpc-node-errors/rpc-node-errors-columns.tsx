import { type ColumnDef } from "@tanstack/react-table";
import { CopyableJson } from "~/components/copyable-json";
import { DataTableColumnHeader } from "~/components/data-table";
import { DeterministicStatusBadge } from "~/components/deterministic-status-badge";
import { useReactiveTime } from "~/hooks/use-reactive-time";
import { formatTimeSince } from "~/lib/utils";
import { type RpcNodeErrorTableSchema } from "./rpc-node-errors-schema";

const text = {
  errorName: "ERROR NAME",
  message: "MESSAGE",
  count: "COUNT",
  lastSeenAt: "LAST SEEN",
  rpcNodeName: "RPC NODE",
  errorData: "ERROR DATA",
};

// Time cell component that updates reactively
const TimeSinceCell = ({ timestamp }: { timestamp: Date }) => {
  useReactiveTime(1000); // Update every second to trigger re-render
  const timeString = formatTimeSince(timestamp.getTime());

  return <span className="text-sm">{timeString} ago</span>;
};

export const RpcNodeErrorsTableColumns: ColumnDef<RpcNodeErrorTableSchema>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.errorName}
      />
    ),
    cell: ({ row }) => {
      const errorName = row.getValue("name");
      if (typeof errorName !== "string") {
        return null;
      }
      return (
        <DeterministicStatusBadge
          text={errorName}
          tooltipContent={`Error: ${errorName}`}
        />
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "message",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.message}
      />
    ),
    cell: ({ row }) => {
      const message = row.getValue("message");
      if (typeof message !== "string") {
        return null;
      }
      return (
        <div className="max-w-xs truncate" title={message}>
          {message}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "count",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.count}
      />
    ),
    cell: ({ row }) => {
      const count = row.getValue("count") as number;
      return (
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            {count}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "lastSeenAt",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.lastSeenAt}
      />
    ),
    cell: ({ row }) => {
      const lastSeenAt = row.getValue("lastSeenAt");
      if (!(lastSeenAt instanceof Date)) {
        return <span className="text-gray-500">Unknown</span>;
      }
      return <TimeSinceCell timestamp={lastSeenAt} />;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "rpcNodeName",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.rpcNodeName}
      />
    ),
    cell: ({ row }) => {
      const rpcNodeName = row.getValue("rpcNodeName") as string | undefined;
      const rpcUrl = row.original.rpcUrl;

      const displayName = rpcNodeName || rpcUrl || "Unknown";

      return (
        <div
          className="font-mono text-xs max-w-xs truncate"
          title={String(displayName)}
        >
          {String(displayName)}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "data",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.errorData}
      />
    ),
    cell: ({ row }) => {
      const errorData = {
        name: row.original.name,
        message: row.original.message,
        cause: row.original.cause,
        stack: row.original.stack,
        data: row.original.data,
        count: row.original.count,
        createdAt:
          row.original.createdAt instanceof Date
            ? row.original.createdAt.toISOString()
            : row.original.createdAt,
        lastSeenAt:
          row.original.lastSeenAt instanceof Date
            ? row.original.lastSeenAt.toISOString()
            : row.original.lastSeenAt,
        rpcNodeName: row.original.rpcNodeName,
        rpcUrl: row.original.rpcUrl ?? null,
      };

      return (
        <div className="max-w-md">
          <CopyableJson data={errorData} />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
];
