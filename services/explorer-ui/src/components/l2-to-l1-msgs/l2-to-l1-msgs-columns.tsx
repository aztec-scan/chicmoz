import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { type ChicmozL2PendingL2ToL1Msg } from "@chicmoz-pkg/types";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";

export const L2ToL1MsgsColumns: ColumnDef<ChicmozL2PendingL2ToL1Msg>[] = [
  {
    accessorKey: "txHash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="TX HASH"
      />
    ),
    cell: ({ row }) => {
      const hash = row.getValue<string>("txHash");
      if (!hash) {
        return <span className="text-gray-400">—</span>;
      }
      return (
        <div className="text-purple-light font-mono text-xs">
          <Link to={`/tx-effects/${hash}`}>{truncateHashString(hash)}</Link>
        </div>
      );
    },
  },
  {
    accessorKey: "index",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="INDEX"
      />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue<number>("index")}</span>
    ),
  },
  {
    accessorKey: "contractAddress",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="CONTRACT"
      />
    ),
    cell: ({ row }) => {
      const addr = row.getValue<string>("contractAddress");
      if (!addr) {
        return <span className="text-gray-400">—</span>;
      }
      const href = `${routes.contracts.route}${routes.contracts.children.instances.route}/${addr}`;
      return (
        <div className="text-purple-light font-mono text-xs">
          <Link to={href}>{truncateHashString(addr)}</Link>
        </div>
      );
    },
  },
  {
    accessorKey: "recipient",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="RECIPIENT (L1)"
      />
    ),
    cell: ({ row }) => {
      const addr = row.getValue<string>("recipient");
      if (!addr) {
        return <span className="text-gray-400">—</span>;
      }
      return (
        <div className="text-purple-light font-mono text-xs">
          <Link to="/l1/address/$address" params={{ address: addr }}>
            {truncateHashString(addr)}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "content",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="CONTENT"
      />
    ),
    cell: ({ row }) => {
      const content = row.getValue<string>("content");
      if (!content) {
        return <span className="text-gray-400">—</span>;
      }
      return (
        <span className="font-mono text-xs">{truncateHashString(content)}</span>
      );
    },
  },
];

/**
 * Columns variant without the txHash column — used on pages where the tx is
 * already known (e.g. pending-tx-details L2→L1 Messages section).
 */
export const L2ToL1MsgsColumnsWithoutTxHash: ColumnDef<ChicmozL2PendingL2ToL1Msg>[] =
  L2ToL1MsgsColumns.filter(
    (col) => (col as { accessorKey?: string }).accessorKey !== "txHash",
  );
