import { type ChicmozL1FeeJuicePortalDeposit } from "@chicmoz-pkg/types";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";

export const FeeJuicePortalDepositsColumns: ColumnDef<ChicmozL1FeeJuicePortalDeposit>[] =
  [
    {
      accessorKey: "l1TransactionHash",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title="L1 TX HASH"
        />
      ),
      cell: ({ row }) => {
        const hash = row.getValue<string | null>("l1TransactionHash");
        if (!hash) return <span className="text-gray-400">—</span>;
        return (
          <a
            href={`https://etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-light font-mono text-xs hover:underline"
          >
            {truncateHashString(hash)}
          </a>
        );
      },
    },
    {
      accessorKey: "l1BlockNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title="L1 BLOCK"
        />
      ),
      cell: ({ row }) => {
        const bn = row.getValue<bigint>("l1BlockNumber");
        return (
          <span className="font-mono text-xs">{bn?.toString() ?? "—"}</span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title="AMOUNT (WEI)"
        />
      ),
      cell: ({ row }) => {
        const amount = row.getValue<bigint>("amount");
        return (
          <span className="font-mono text-xs">{amount?.toString() ?? "—"}</span>
        );
      },
    },
    {
      accessorKey: "secretHash",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title="SECRET HASH"
        />
      ),
      cell: ({ row }) => {
        const h = row.getValue<string>("secretHash");
        if (!h) return <span className="text-gray-400">—</span>;
        return <span className="font-mono text-xs">{truncateHashString(h)}</span>;
      },
    },
    {
      accessorKey: "key",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title="MSG KEY"
        />
      ),
      cell: ({ row }) => {
        const k = row.getValue<string>("key");
        if (!k) return <span className="text-gray-400">—</span>;
        return <span className="font-mono text-xs">{truncateHashString(k)}</span>;
      },
    },
    {
      accessorKey: "isFinalized",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title="FINALIZED"
        />
      ),
      cell: ({ row }) => {
        const fin = row.getValue<boolean>("isFinalized");
        return (
          <span
            className={
              fin ? "text-green-600 font-medium" : "text-amber-600 font-medium"
            }
          >
            {fin ? "Yes" : "No"}
          </span>
        );
      },
    },
  ];
