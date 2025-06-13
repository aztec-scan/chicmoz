import { type ColumnDef } from "@tanstack/react-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { DataTableColumnHeader } from "../data-table";
import { type ChicmozFeeRecipient } from "@chicmoz-pkg/types";
import { CustomTooltip } from "../custom-tooltip";
import { CopyableText } from "../copy-text";

export const FeeReceipientsColums: ColumnDef<ChicmozFeeRecipient>[] = [
  {
    accessorKey: "l2Address",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={"HASH"}
      />
    ),
    cell: ({ row }) => {
      const hash = String(row.getValue("l2Address"));
      return <CopyableText toCopy={hash} text={truncateHashString(hash)} />;
    },
  },
  {
    accessorKey: "feesReceived",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={"received"}
      />
    ),
    cell: ({ row }) => {
      console.log(row.getValue("feesReceived"));
      return (
        <CustomTooltip content="The amount of FJ received">
          <div className="font-mono">
            {String(row.getValue("feesReceived"))}
          </div>
        </CustomTooltip>
      );
    },
  },
  {
    accessorKey: "nbrOfBlocks",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={"nbr of Blocks"}
      />
    ),
    cell: ({ row }) => {
      return (
        <CustomTooltip content="The amount of FJ received">
          <div className="font-mono">{row.getValue("nbrOfBlocks")}</div>
        </CustomTooltip>
      );
    },
  },
  {
    accessorKey: "calculatedForNumberOfBlocks",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={"calculated for blocks"}
      />
    ),
    cell: ({ row }) => {
      return (
        <CustomTooltip content="Calculated for number of blocks">
          <div className="font-mono">
            {row.getValue("calculatedForNumberOfBlocks")}
          </div>
        </CustomTooltip>
      );
    },
  },
  {
    accessorKey: "partOfTotalFeesReceived",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={"part of total fees received"}
      />
    ),
    cell: ({ row }) => {
      return (
        <CustomTooltip content="Part of total fees received">
          <div className="font-mono">
            {row.getValue("partOfTotalFeesReceived")}
          </div>
        </CustomTooltip>
      );
    },
  },
];
