import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { CopyableText } from "~/components/copy-text";
import { DataTableColumnHeader } from "~/components/data-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";
import { getClassVersionLink } from "../utils";
import { type ContractInstance } from "./schema";

const text = {
  address: "ADDRESS",
  blockHash: "BLOCK HASH",
  blockHeight: "HEIGHT",
  version: "VERSION",
  contractClassId: "CONTRACT CLASS ID",
  deployer: "DEPLOYER",
};

export const contractsTableColumns: ColumnDef<ContractInstance>[] = [
  {
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.address}
      />
    ),
    cell: ({ row }) => {
      const address = row.getValue("address");
      if (typeof address !== "string") return null;
      const r = `${routes.contracts.route}/${routes.contracts.children.instances.route}/${address}`;
      const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      return (
        <div className="text-purple-light font-mono">
          <Link to={r}>{truncatedAddress}</Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "version",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.version}
      />
    ),
    cell: ({ row }) =>
      getClassVersionLink(
        row.getValue("contractClassId"),
        row.getValue("version"),
      ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "contractClassId",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.contractClassId}
      />
    ),
    cell: ({ row }) => (
      <CopyableText
        toCopy={row.getValue("contractClassId")}
        text={truncateHashString(row.getValue("contractClassId"))}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "deployer",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.deployer}
      />
    ),
    cell: ({ row }) => (
      <CopyableText
        toCopy={row.getValue("deployer")}
        text={truncateHashString(row.getValue("deployer"))}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "blockHash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.blockHash}
      />
    ),
    cell: ({ row }) => {
      const blockHash = row.getValue("blockHash");
      if (typeof blockHash !== "string") return null;
      const r = `${routes.blocks.route}/${blockHash}`;
      const truncatedBlockHash = `${blockHash.slice(0, 6)}...${blockHash.slice(
        -4,
      )}`;
      return (
        <div className="text-purple-light font-mono">
          <Link to={r}>{truncatedBlockHash}</Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
