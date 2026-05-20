import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { type PublicCallRequest } from "@chicmoz-pkg/types";
import { truncateHashString } from "~/lib/create-hash-string";
import { DataTableColumnHeader } from "~/components/data-table";
import { Badge } from "~/components/ui/badge";
import { routes } from "~/routes/__root";
import { cn } from "~/lib/utils";

const callTypeBadgeClass: Record<PublicCallRequest["callType"], string> = {
  non_revertible: "bg-green-100 text-green-800 border-green-200",
  revertible: "bg-blue-100 text-blue-800 border-blue-200",
  teardown: "bg-amber-100 text-amber-800 border-amber-200",
};

export const PublicCallRequestsColumns: ColumnDef<PublicCallRequest>[] = [
  {
    accessorKey: "msgSender",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="MSG SENDER"
      />
    ),
    cell: ({ row }) => {
      const addr = row.getValue<string>("msgSender");
      if (!addr) return <span className="text-gray-400">—</span>;
      return (
        <div className="text-purple-light font-mono text-xs">
          <Link to={`/address/${addr}`}>{truncateHashString(addr)}</Link>
        </div>
      );
    },
  },
  {
    accessorKey: "contractAddress",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="CONTRACT ADDRESS"
      />
    ),
    cell: ({ row }) => {
      const addr = row.getValue<string>("contractAddress");
      if (!addr) return <span className="text-gray-400">Unknown</span>;
      const href = `${routes.contracts.route}${routes.contracts.children.instances.route}/${addr}`;
      return (
        <div className="text-purple-light font-mono text-xs">
          <Link to={href}>{truncateHashString(addr)}</Link>
        </div>
      );
    },
  },
  {
    accessorKey: "contractName",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="CONTRACT NAME"
      />
    ),
    cell: ({ row }) => {
      const contractName = row.getValue<string | undefined>("contractName");
      if (!contractName) return <span className="text-gray-400">Unknown</span>;
      return <span className="text-xs font-medium">{contractName}</span>;
    },
  },
  {
    accessorKey: "functionName",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="FUNCTION NAME"
      />
    ),
    cell: ({ row }) => {
      const functionName = row.getValue<string | undefined>("functionName");
      if (!functionName) return <span className="text-gray-400">Unknown</span>;
      return <span className="text-xs font-medium">{functionName}</span>;
    },
  },
  {
    accessorKey: "functionSelector",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="FUNCTION SELECTOR"
      />
    ),
    cell: ({ row }) => {
      const sel = row.getValue<string | undefined>("functionSelector");
      if (!sel) return <span className="text-gray-400">Unknown</span>;
      return <span className="font-mono text-xs">{sel}</span>;
    },
  },
  {
    accessorKey: "callType",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="CALL TYPE"
      />
    ),
    cell: ({ row }) => {
      const callType = row.getValue<PublicCallRequest["callType"]>("callType");
      return (
        <Badge
          className={cn(
            "capitalize border",
            callTypeBadgeClass[callType] ?? "",
          )}
        >
          {callType.replace(/_/g, " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isStaticCall",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title="STATIC"
      />
    ),
    cell: ({ row }) => {
      const isStatic = row.getValue<boolean>("isStaticCall");
      return isStatic ? (
        <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
          Yes
        </Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      );
    },
  },
];

export const PublicCallRequestsColumnsWithoutSender: ColumnDef<PublicCallRequest>[] =
  PublicCallRequestsColumns.filter(
    (col) => (col as { accessorKey?: string }).accessorKey !== "msgSender",
  );
