import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, type FC } from "react";
import { DataTable, DataTableColumnHeader } from "~/components/data-table";
import { useGetLatestTxEffects, usePendingTxs } from "~/hooks";
import { truncateHashString } from "~/lib/create-hash-string";
import { formatTimeSince } from "~/lib/utils";
import { routes } from "~/routes/__root";

// Simplified schema for pending transactions
interface PendingTxSchema {
  txHash: string;
  timestamp: number;
}

interface PendingTxsTableProps {
  title?: string;
  disableSizeSelector?: boolean;
  maxEntries?: number;
}

// Define the columns for the pending tx table
const pendingTxsColumns: ColumnDef<PendingTxSchema>[] = [
  {
    accessorKey: "txHash",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-purple-dark text-sm "
        column={column}
        title={"HASH"}
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
        title={"AGE"}
      />
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as number;
      return <div>{formatTimeSince(timestamp)}</div>;
    },
  },
];

export const PendingTxsTable: FC<PendingTxsTableProps> = ({
  title = "Latest Pending Transactions",
  disableSizeSelector = false,
  maxEntries = 10,
}) => {
  const { data: pendingTxs, isLoading: isPendingLoading } = usePendingTxs();
  const { data: latestTxEffectsData, isLoading: isLatestLoading } =
    useGetLatestTxEffects();

  // Prepare pending transactions data - only hash and timestamp
  const pendingTxsData = useMemo(() => {
    if (!pendingTxs || !latestTxEffectsData) return [];

    return pendingTxs
      .filter(
        (tx) =>
          !latestTxEffectsData.some((effect) => effect.txHash === tx.hash),
      )
      .map((tx) => ({
        txHash: tx.hash,
        timestamp: tx.birthTimestamp ?? 0,
      }));
  }, [pendingTxs, latestTxEffectsData]);
  const isLoading = isPendingLoading || isLatestLoading;

  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && (
          <div className="flex flex-row justify-between md:min-h-20">
            <h3 className="ml-0.5">{title}</h3>
          </div>
        )}
        <DataTable
          isLoading={isLoading}
          data={pendingTxsData}
          columns={pendingTxsColumns}
          disableSizeSelector={disableSizeSelector}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
