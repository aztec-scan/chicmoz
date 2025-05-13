import { ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, type FC } from "react";
import { DataTable, DataTableColumnHeader } from "~/components/data-table";
import { useGetLatestTxEffects, usePendingTxs } from "~/hooks";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";
import { TimeAgoCell } from "../formated-time-cell";

// Simplified schema for pending transactions
interface PendingTxSchema {
  txHash: string;
  timestamp: number;
}

interface PendingTxsTableProps {
  title?: string;
  pendingTxs?: ChicmozL2PendingTx[];
  isLoading?: boolean;
  error?: unknown;
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
      return <TimeAgoCell timestamp={timestamp} />;
    },
  },
];

export const PendingTxsTable: FC<PendingTxsTableProps> = ({
  title = "Latest Pending Transactions",
  pendingTxs: propsPendingTxs,
  isLoading: propsIsLoading,
  error: propsError,
  disableSizeSelector = false,
  maxEntries = 10,
}) => {
  // Fetch data internally if not provided as props (for backward compatibility)
  const {
    data: fetchedPendingTxs,
    isLoading: isPendingLoading,
    error: fetchedError,
  } = usePendingTxs();
  const { data: latestTxEffectsData, isLoading: isLatestLoading } =
    useGetLatestTxEffects();

  // Use props if provided, otherwise use fetched data
  const pendingTxs = propsPendingTxs ?? fetchedPendingTxs;
  const error = propsError ?? fetchedError;

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

  // Use props isLoading if provided, otherwise use internal loading state
  const isLoading = propsIsLoading ?? (isPendingLoading || isLatestLoading);

  // Handle error state
  if (error) {
    return (
      <section className="relative mx-0 w-full transition-all">
        <div className="space-y-4 bg-white rounded-lg p-5">
          {title && (
            <div className="flex flex-row justify-between md:min-h-20">
              <h3 className="ml-0.5">{title}</h3>
            </div>
          )}
          <div className="p-4 text-red-500">
            Error loading pending transactions
          </div>
        </div>
      </section>
    );
  }

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
