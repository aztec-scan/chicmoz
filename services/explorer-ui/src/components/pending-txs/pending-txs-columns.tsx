import { type ColumnDef } from "@tanstack/react-table";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";
import { DataTableColumnHeader } from "../data-table";
import { Link } from "@tanstack/react-router";
import { TimeAgoCell } from "../formated-time-cell";
import { type PendingTxSchema } from "./pending-txs-schema";

// Define the columns for the pending tx table
export const PendingTxsColumns: ColumnDef<PendingTxSchema>[] = [
  {
    accessorKey: "hash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={"HASH"}
      />
    ),
    cell: ({ row }) => {
      const hash = row.getValue("hash");
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
    accessorKey: "birthTimestamp",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm"
        column={column}
        title={"AGE"}
      />
    ),
    cell: ({ row }) => {
      const timestamp = Number(row.getValue("birthTimestamp"));
      return <TimeAgoCell timestamp={timestamp} />;
    },
  },
];
