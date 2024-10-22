import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { routes } from "~/routes/__root";
import { DataTableColumnHeader } from "~/components/data-table";
import { type ContractClass } from "./schema";
import { truncateHashString } from "~/lib/create-hash-string";
import { CopyableText } from "~/components/copy-text";
import { getClassVersionLink } from "../utils";

const text = {
  blockHash: "BLOCK HASH",
  contractClassId: "CLASS ID",
  version: "VERSION",
  artifactHash: "ARTIFACT HASH",
  privateFunctionsRoot: "PRIVATE FUNCTIONS ROOT",
};

export const contractsTableColumns: ColumnDef<ContractClass>[] = [
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
        row.getValue("version")
      ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "artifactHash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.artifactHash}
      />
    ),
    cell: ({ row }) => (
      <CopyableText
        toCopy={row.getValue("artifactHash")}
        text={truncateHashString(row.getValue("artifactHash"))}
      />
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "privateFunctionsRoot",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={text.privateFunctionsRoot}
      />
    ),
    cell: ({ row }) => (
      <CopyableText
        toCopy={row.getValue("privateFunctionsRoot")}
        text={truncateHashString(row.getValue("privateFunctionsRoot"))}
      />
    ),
    enableSorting: false,
    enableHiding: true,
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
      const hash = row.getValue("blockHash");
      if (typeof hash !== "string") return null;
      const r = `${routes.blocks.route}/${hash}`;
      const truncatedTxHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
      return (
        <div className="text-purple-light font-mono font-bold">
          <Link to={r}>{truncatedTxHash}</Link>
        </div>
      );
    },
  },
];
