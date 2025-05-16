import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { ContractEventsTableColumns } from "./contract-events-columns";
import { type ContractEventTableSchema } from "./contract-events-schema";

interface Props {
  title?: string;
  contractEvents?: ContractEventTableSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  disablePagination?: boolean;
  maxEntries?: number;
}

export const ContractEventsTable: FC<Props> = ({
  title,
  contractEvents,
  isLoading,
  error,
  disableSizeSelector,
  disablePagination = false,
  maxEntries = 10,
}) => {
  if (!contractEvents) {
    return <div>No data</div>;
  }
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }
  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && (
          <div className="flex flex-col md:flex-row gap-3 justify-between md:min-h-16 items-start md:items-center">
            <h3 className="ml-0.5">{title}</h3>
          </div>
        )}
        <DataTable
          isLoading={isLoading}
          data={contractEvents}
          columns={ContractEventsTableColumns}
          disableSizeSelector={disableSizeSelector}
          disablePagination={disablePagination}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
