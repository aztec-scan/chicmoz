import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { SequencerErrorsTableColumns } from "./sequencer-errors-columns";
import { type SequencerErrorTableSchema } from "./sequencer-errors-schema";

interface Props {
  title?: string;
  sequencerErrors?: SequencerErrorTableSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  disablePagination?: boolean;
  maxEntries?: number;
}

export const SequencerErrorsTable: FC<Props> = ({
  title,
  sequencerErrors,
  isLoading,
  error,
  disableSizeSelector = true,
  disablePagination = false,
  maxEntries = 10,
}) => {
  if (!sequencerErrors) {
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
          data={sequencerErrors ?? []}
          columns={SequencerErrorsTableColumns}
          disableSizeSelector={disableSizeSelector}
          disablePagination={disablePagination}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
