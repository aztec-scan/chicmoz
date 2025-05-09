import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { routes } from "~/routes/__root";
import { DataTableColumnHeader } from "~/components/data-table";
import { type TxEffectTableSchema } from "./tx-effects-schema";
import { truncateHashString } from "~/lib/create-hash-string";
import { TimeAgoCell } from "../formated-time-cell";

const text = {
  txHash: "HASH",
  transactionFee: "FEE (FPA)",
  blockHeight: "HEIGHT",
  timeSince: "AGE",
};

export const TxEffectsTableColumns: ColumnDef<TxEffectTableSchema>[] = [
  {
    accessorKey: "txHash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.txHash}
      />
    ),
    cell: ({ row }) => {
      const hash = row.getValue("txHash");
      if (typeof hash !== "string") {
        return null;
      }
      const r = `${routes.txEffects.route}/${hash}`;
      const truncatedTxHash = truncateHashString(hash);
      return (
        <div className="text-purple-light font-mono">
          <Link to={r}>{truncatedTxHash}</Link>
        </div>
      );
    },
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
    accessorKey: "transactionFee",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={text.transactionFee}
      />
    ),
    cell: ({ row }) => (
      <div className="font-mono">{row.getValue("transactionFee")}</div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "blockNumber",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.blockHeight}
      />
    ),
    cell: ({ row }) => {
      const blockNumber = row.getValue("blockNumber");
      if (typeof blockNumber !== "number") {
        return null;
      }
      const r = `${routes.blocks.route}/${blockNumber}`;
      return (
        <div className="text-purple-light font-mono">
          <Link to={r}>{blockNumber}</Link>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
];
