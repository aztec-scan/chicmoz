import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { type PendingTxSchema } from "./pending-txs-schema";
import { PendingTxsColumns } from "./pending-txs-columns";

interface Props {
  title?: string;
  pendingTxEffects?: PendingTxSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  maxEntries?: number;
}

export const PendingTxsTable: FC<Props> = ({
  title,
  pendingTxEffects,
  isLoading,
  error,
  disableSizeSelector,
  maxEntries = 10,
}) => {
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
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
          data={pendingTxEffects ?? []}
          columns={PendingTxsColumns}
          disableSizeSelector={disableSizeSelector}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
