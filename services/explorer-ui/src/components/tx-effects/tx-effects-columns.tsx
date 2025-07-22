import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";
import { CustomTooltip } from "../custom-tooltip";
import { TimeAgoCell } from "../formated-time-cell";
import { type UiTxEffectTable } from "@chicmoz-pkg/types";

const text = {
  txHash: "HASH",
  transactionFee: "FEE (FJ)",
  blockHeight: "HEIGHT",
  timeSince: "AGE",
};

export const TxEffectsTableColumns: ColumnDef<UiTxEffectTable>[] = [
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
      const unixTimestamp = Math.floor(timestamp / 1000);
      return <TimeAgoCell timestamp={unixTimestamp} />;
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
      <CustomTooltip content="The amount of FJ paid for this transaction">
        <div className="font-mono">{row.getValue("transactionFee")}</div>
      </CustomTooltip>
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
      const blockNumber = Number(row.getValue("blockNumber"));
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
