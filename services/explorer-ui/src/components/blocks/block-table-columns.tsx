import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { formatTimeSince } from "~/lib/utils";
import { routes } from "~/routes/__root";
import type { BlockTableSchema } from "./blocks-schema";
import { truncateHashString } from "~/lib/create-hash-string";
import { BlockStatusBadge } from "../block-status-badge";

const text = {
  height: "HEIGHT",
  blockHash: "BLOCK HASH",
  txEffectsLength: "NBR OF TXS",
  timeSince: "AGE",
  blockStatus: "BLOCK STATUS"
};

export const BlockTableColumns: ColumnDef<BlockTableSchema>[] = [
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
      const height = row.getValue("height");
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const r = routes.blocks.route + "/" + height;
      return (
        <div className="text-purple-light">
          <Link to={r}>{row.getValue("height")}</Link>
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
      if (typeof blockHash !== "string") { return null; }
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
      const formattedTime = formatTimeSince(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        row.getValue("timestamp") as unknown as number,
      );
      return <div className="text-purple-dark">{formattedTime}</div>;
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
      <BlockStatusBadge className="font-mono" status={row.getValue("blockStatus")} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
