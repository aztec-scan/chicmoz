import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { formatCompactUnits } from "~/lib/utils";
import { routes } from "~/routes/__root";
import { EtherscanAddressLink } from "../etherscan-address-link";
import { TimeAgoCell } from "../formated-time-cell";
import { ValidatorStatusBadge } from "../validator-status-badge";
import { type ValidatorTableSchema } from "./validators-schema";

const text = {
  attester: "ATTESTER",
  stake: "STAKE",
  withdrawer: "WITHDRAWER",
  proposer: "PROPOSER",
  status: "STATUS",
  firstSeenAt: "FIRST SEEN",
  latestSeenChangeAt: "LATEST SEEN CHANGE",
};

const getLinkCell = (content: string, endpoint: string) => (
  <EtherscanAddressLink
    content={truncateHashString(content)}
    endpoint={endpoint}
    showExternalLinkIcon={false}
  />
);

type CreateValidatorsTableColumnsArgs = {
  stakingAssetAddress?: string;
  stakingAssetDecimals?: number;
  stakingAssetSymbol?: string;
};

export const createValidatorsTableColumns = ({
  stakingAssetAddress,
  stakingAssetDecimals,
  stakingAssetSymbol,
}: CreateValidatorsTableColumnsArgs): ColumnDef<ValidatorTableSchema>[] => [
    {
      accessorKey: "attester",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.attester}
        />
      ),
      cell: ({ row }) => {
        const attester = row.getValue("attester");
        if (typeof attester !== "string") {
          return null;
        }
        return (
          <Link to={`${routes.l1.route}/${routes.validators.route}/${attester}`}>
            <div className="text-purple-light font-mono">
              {truncateHashString(attester)}
            </div>
          </Link>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "withdrawer",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.withdrawer}
        />
      ),
      cell: ({ row }) => {
        const withdrawer = row.getValue("withdrawer");
        if (typeof withdrawer !== "string") {
          return null;
        }
        return getLinkCell(withdrawer, `/address/${withdrawer}`);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "proposer",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.proposer}
        />
      ),
      cell: ({ row }) => {
        const proposer = row.getValue("proposer");
        if (typeof proposer !== "string") {
          return null;
        }
        return getLinkCell(proposer, `/address/${proposer}`);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "stake",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.stake}
        />
      ),
      cell: ({ row }) => {
        const rawStake = row.getValue("stake");
        if (typeof rawStake !== "bigint") {
          return null;
        }

        const stake = formatCompactUnits(rawStake, stakingAssetDecimals);
        const symbol = stakingAssetSymbol ?? "AZTEC";

        return (
          <div className="font-mono flex items-center gap-1">
            <span>{stake}</span>
            {stakingAssetAddress ? (
              <EtherscanAddressLink
                content={symbol}
                endpoint={`/token/${stakingAssetAddress}`}
                showExternalLinkIcon={false}
                tooltipContent="View token address on Etherscan"
              />
            ) : (
              <span>{symbol}</span>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.status}
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status");
        if (typeof status !== "number") {
          return null;
        }
        return <ValidatorStatusBadge status={status} />;
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "firstSeenAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.firstSeenAt}
        />
      ),
      cell: ({ row }) => {
        const date = Number(row.getValue("firstSeenAt"));
        return <TimeAgoCell timestamp={date} />;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "latestSeenChangeAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.latestSeenChangeAt}
        />
      ),
      cell: ({ row }) => {
        const date = Number(row.getValue("latestSeenChangeAt"));
        return <TimeAgoCell timestamp={date} />;
      },
      enableSorting: true,
      enableHiding: true,
    },
  ];
