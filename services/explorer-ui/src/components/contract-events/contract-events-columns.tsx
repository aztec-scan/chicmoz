import { getL1NetworkId } from "@chicmoz-pkg/types";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { DeterministicStatusBadge } from "~/components/deterministic-status-badge";
import { truncateHashString } from "~/lib/create-hash-string";
import { L2_NETWORK_ID } from "~/service/constants";
import { CustomTooltip } from "../custom-tooltip";
import { type ContractEventTableSchema } from "./contract-events-schema";

const text = {
  eventName: "EVENT NAME",
  contractAddress: "CONTRACT ADDRESS",
  blockNumber: "BLOCK NUMBER",
  transactionHash: "TRANSACTION HASH",
  args: "ARGS",
};

const ETHERSCAN_URL =
  getL1NetworkId(L2_NETWORK_ID) === "ETH_MAINNET"
    ? "https://etherscan.io"
    : "https://sepolia.etherscan.io";

const getLinkCell = (content: string, endpoint: string) => {
  if (
    getL1NetworkId(L2_NETWORK_ID) === "ETH_SEPOLIA" ||
    getL1NetworkId(L2_NETWORK_ID) === "ETH_MAINNET"
  ) {
    return (
      <CustomTooltip content={`View on Etherscan`}>
        <a
          className="text-purple-light font-mono"
          href={`${ETHERSCAN_URL}${endpoint}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
          <ExternalLinkIcon className="inline-block ml-1" />
        </a>
      </CustomTooltip>
    );
  } else {
    return <div className="font-mono">{content}</div>;
  }
};

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
