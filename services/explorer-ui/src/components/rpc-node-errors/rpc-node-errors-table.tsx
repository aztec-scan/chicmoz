import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { RpcNodeErrorsTableColumns } from "./rpc-node-errors-columns";
import { type RpcNodeErrorTableSchema } from "./rpc-node-errors-schema";

interface Props {
  title?: string;
  rpcNodeErrors?: RpcNodeErrorTableSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  disablePagination?: boolean;
  maxEntries?: number;
}

export const RpcNodeErrorsTable: FC<Props> = ({
  title,
  rpcNodeErrors,
  isLoading,
  error,
  disableSizeSelector = true,
  disablePagination = false,
  maxEntries = 10,
}) => {
  if (!rpcNodeErrors) {
    return <div>No data</div>;
  }
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }
  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5 dark:bg-gray-800">
        {title && (
          <div className="flex flex-col md:flex-row gap-3 justify-between md:min-h-16 items-start md:items-center">
            <h3 className="ml-0.5 text-primary dark:text-white">{title}</h3>
          </div>
        )}
        <DataTable
          isLoading={isLoading}
          data={rpcNodeErrors ?? []}
          columns={RpcNodeErrorsTableColumns}
          disableSizeSelector={disableSizeSelector}
          disablePagination={disablePagination}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
