import { type ColumnDef } from "@tanstack/react-table";
import { type ChicmozFeeRecipient } from "@chicmoz-pkg/types";
import { CopyableAmount } from "~/components/copyable-amount";
import { truncateHashString } from "~/lib/create-hash-string";
import { formatFees, getFeeJuiceSymbol } from "~/lib/utils";
import { DataTableColumnHeader } from "../data-table";
import { CustomTooltip } from "../custom-tooltip";
import { CopyableText } from "../copy-text";
import { EtherscanAddressLink } from "../etherscan-address-link";

type CreateFeeRecipientColumnsArgs = {
  feeJuiceAddress?: string;
  feeJuiceDecimals?: number;
  feeJuiceSymbol?: string;
};

export const createFeeRecipientColumns = ({
  feeJuiceAddress,
  feeJuiceDecimals,
  feeJuiceSymbol,
}: CreateFeeRecipientColumnsArgs): ColumnDef<ChicmozFeeRecipient>[] => [
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
      const symbol = getFeeJuiceSymbol(feeJuiceSymbol);
      const formattedFees = formatFees(
        String(row.getValue("feesReceived")),
        feeJuiceDecimals,
      );
      const formattedValue = `${formattedFees.value}${formattedFees.denomination}`;

      return (
        <div className="font-mono flex items-center gap-1">
          <CopyableAmount
            displayAmount={formattedValue}
            rawAmount={String(row.getValue("feesReceived"))}
          />
          {feeJuiceAddress ? (
            <EtherscanAddressLink
              content={symbol}
              endpoint={`/token/${feeJuiceAddress}`}
              showExternalLinkIcon={false}
              tooltipContent="View token address on Etherscan"
            />
          ) : (
            <span>{symbol}</span>
          )}
        </div>
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
        <CustomTooltip
          content={`The number of blocks with ${getFeeJuiceSymbol(feeJuiceSymbol)} rewards received`}
        >
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
        title={"% of total fees received"}
      />
    ),
    cell: ({ row }) => {
      const percentage = Number(row.getValue("partOfTotalFeesReceived"));
      return (
        <CustomTooltip content="% of total fees received">
          <div className="font-mono">{percentage * 100}%</div>
        </CustomTooltip>
      );
    },
  },
];
