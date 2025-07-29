import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { DeterministicStatusBadge } from "~/components/deterministic-status-badge";
import { TimeAgoCell } from "~/components/formated-time-cell";

interface ProcessedHistoryEntry {
  id: string;
  timestamp: Date;
  keyChanged: string;
  newValue: string;
}

const text = {
  time: "TIME",
  keyChanged: "KEY CHANGED",
  newValue: "NEW VALUE",
};

export const ValidatorHistoryTableColumns: ColumnDef<ProcessedHistoryEntry>[] =
  [
    {
      accessorKey: "keyChanged",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.keyChanged}
        />
      ),
      cell: ({ row }) => {
        const keyChanged = row.getValue("keyChanged");
        if (typeof keyChanged !== "string") {
          return null;
        }
        return <DeterministicStatusBadge text={keyChanged} />;
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "newValue",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.newValue}
        />
      ),
      cell: ({ row }) => {
        const newValue = row.getValue("newValue");
        if (typeof newValue !== "string") {
          return null;
        }
        return <div className="font-mono">{newValue}</div>;
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.time}
        />
      ),
      cell: ({ row }) => {
        const timestamp = Number(row.getValue("timestamp"));
        return <TimeAgoCell timestamp={timestamp} />;
      },
      enableSorting: true,
      enableHiding: false,
    },
  ];
