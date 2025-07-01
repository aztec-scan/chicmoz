import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { DeterministicStatusBadge } from "~/components/deterministic-status-badge";
import { truncateHashString } from "~/lib/create-hash-string";
import { EtherscanAddressLink } from "../etherscan-address-link";
import { type ContractEventTableSchema } from "./contract-events-schema";

const text = {
  eventName: "L1 EVENT NAME",
  contractAddress: "L1 CONTRACT ADDRESS",
  blockNumber: "L1 BLOCK NUMBER",
  transactionHash: "L1 TRANSACTION HASH",
  args: "ARGS",
};

const getLinkCell = (content: string, endpoint: string) => (
  <EtherscanAddressLink
    content={truncateHashString(content)}
    endpoint={endpoint}
  />
);

export const ContractEventsTableColumns: ColumnDef<ContractEventTableSchema>[] =
  [
    {
      accessorKey: "l1BlockNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.blockNumber}
        />
      ),
      cell: ({ row }) => {
        const blockNumber = Number(row.getValue("l1BlockNumber"));
        return getLinkCell(blockNumber.toString(), `/block/${blockNumber}`);
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "l1ContractAddress",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.contractAddress}
        />
      ),
      cell: ({ row }) => {
        const address = row.getValue("l1ContractAddress");
        if (typeof address !== "string") {
          return null;
        }
        const truncatedAddress = truncateHashString(address);
        return getLinkCell(truncatedAddress, `/address/${address}`);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "l1TransactionHash",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.transactionHash}
        />
      ),
      cell: ({ row }) => {
        const hash = row.getValue("l1TransactionHash");
        if (typeof hash !== "string") {
          return <div className="font-mono">N/A</div>;
        }
        const truncatedHash = truncateHashString(hash);
        return getLinkCell(truncatedHash, `/tx/${hash}`);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "eventName",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.eventName}
        />
      ),
      cell: ({ row }) => {
        const eventName = row.getValue("eventName");
        if (typeof eventName !== "string") {
          return null;
        }
        return (
          <DeterministicStatusBadge
            text={eventName}
            tooltipContent={`Event: ${eventName}`}
          />
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "eventArgs",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-purple-dark text-sm"
          column={column}
          title={text.args}
        />
      ),
      cell: ({ row }) => {
        const args = row.getValue("eventArgs");
        // TODO: make this copyable
        return (
          <pre className="whitespace-pre-wrap text-xs max-w-md overflow-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
  ];
