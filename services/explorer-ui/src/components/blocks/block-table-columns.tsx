import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { routes } from "~/routes/__root";
import { truncateHashString } from "~/lib/create-hash-string";
import { BlockStatusBadge } from "../block-status-badge";
import { TimeAgoCell } from "../formated-time-cell";
import { type UiBlockTable } from "@chicmoz-pkg/types";

const text = {
  height: "HEIGHT",
  blockHash: "BLOCK HASH",
  txEffectsLength: "NBR OF TXS",
  timeSince: "AGE",
  blockStatus: "BLOCK STATUS",
};

export const BlockTableColumns: ColumnDef<UiBlockTable>[] = [
  {
    accessorKey: "height",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.height}
      />
    ),
    cell: ({ row }) => {
      const height = Number(row.getValue("height"));
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const r = routes.blocks.route + "/" + height;
      return (
        <div className="text-purple-light">
          <Link to={r}>{Number(row.getValue("height"))}</Link>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "blockHash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm text-wrap"
        column={column}
        title={text.blockHash}
      />
    ),
    cell: ({ row }) => {
      const blockHash = row.getValue("blockHash");
      if (typeof blockHash !== "string") {
        return null;
      }
      const r = `${routes.blocks.route}/${blockHash}`;
      return (
        <div className="text-purple-light font-mono">
          <Link to={r}>{truncateHashString(blockHash)}</Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.timeSince}
      />
    ),
    cell: ({ row }) => {
      const timestamp = Number(row.getValue("timestamp"));
      return <TimeAgoCell timestamp={timestamp} />;
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "txEffectsLength",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.txEffectsLength}
      />
    ),
    cell: ({ row }) => (
      <div className="text-purple-dark">{row.getValue("txEffectsLength")}</div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "blockStatus",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.blockStatus}
      />
    ),
    cell: ({ row }) => (
      <BlockStatusBadge
        className="font-mono"
        status={row.getValue("blockStatus")}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
