import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { type UiTxEffectTable } from "@chicmoz-pkg/types";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { formatFees, getFeeJuiceSymbol } from "~/lib/utils";
import { routes } from "~/routes/__root";
import { CustomTooltip } from "../custom-tooltip";
import { EtherscanAddressLink } from "../etherscan-address-link";
import { TimeAgoCell } from "../formated-time-cell";

const text = {
  txHash: "HASH",
  transactionFee: "FEE",
  blockHeight: "HEIGHT",
  timeSince: "AGE",
};

const compareDecimalStrings = (left: string, right: string): number => {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);

  if (leftValue === rightValue) {
    return 0;
  }

  return leftValue > rightValue ? 1 : -1;
};

type CreateTxEffectsTableColumnsArgs = {
  feeJuiceAddress?: string;
  feeJuiceDecimals?: number;
  feeJuiceSymbol?: string;
};

export const createTxEffectsTableColumns = ({
  feeJuiceAddress,
  feeJuiceDecimals,
  feeJuiceSymbol,
}: CreateTxEffectsTableColumnsArgs): ColumnDef<UiTxEffectTable>[] => [
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
    cell: ({ row }) => {
      const symbol = getFeeJuiceSymbol(feeJuiceSymbol);
      const formattedFee = formatFees(
        String(row.getValue("transactionFee")),
        feeJuiceDecimals,
      );
      const formattedValue = `${formattedFee.value}${formattedFee.denomination}`;

      return (
        <div className="font-mono flex items-center gap-1">
          <CustomTooltip
            content={`The amount of ${symbol} paid for this transaction`}
          >
            <span>{formattedValue}</span>
          </CustomTooltip>
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
    sortingFn: (rowA, rowB, columnId) => {
      const left = rowA.getValue(columnId);
      const right = rowB.getValue(columnId);

      if (typeof left !== "string" || typeof right !== "string") {
        return 0;
      }

      return compareDecimalStrings(left, right);
    },
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
      if (typeof blockNumber !== "bigint") {
        return null;
      }
      const r = `${routes.blocks.route}/${blockNumber}`;
      return (
        <div className="text-purple-light font-mono">
          <Link to={r}>{blockNumber.toString()}</Link>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
];
