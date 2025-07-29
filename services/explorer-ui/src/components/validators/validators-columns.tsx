import { type L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";
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
  />
);

export const ValidatorsTableColumns: ColumnDef<ValidatorTableSchema>[] = [
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
      const stake = (Number(rawStake) / 10 ** 18).toFixed(2);

      return <div className="font-mono flex items-center">{stake} STK</div>; // TODO: 1. use Viem to get the decimals 2. use Viem to get the symbol
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
      const status = row.getValue("status") as L1L2ValidatorStatus;
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
