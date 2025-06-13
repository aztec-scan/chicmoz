import { type ChicmozL1L2ValidatorHistory } from "@chicmoz-pkg/types";
import { useMemo, type FC } from "react";
import { DataTable } from "~/components/data-table";
import { ValidatorHistoryTableColumns } from "./validator-history-table-columns";

interface Props {
  title?: string;
  attesterAddress: string;
  history?: ChicmozL1L2ValidatorHistory;
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  disablePagination?: boolean;
  maxEntries?: number;
}

export const ValidatorHistoryTable: FC<Props> = ({
  title,
  history,
  attesterAddress,
  isLoading,
  error,
  disableSizeSelector,
  disablePagination = false,
  maxEntries = 10,
}) => {
  const processedHistory = useMemo(() => {
    if (!history) {
      return [];
    }

    return history.map((entry, index) => {
      return {
        id: `${entry[0].getTime()}-${index}`,
        timestamp: entry[0],
        keyChanged: entry[1],
        newValue: entry[2],
      };
    });
  }, [history]);
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
        <p className="text-sm text-gray-500">
          Psst!{" "}
          <a
            href={`https://aztec.starfrich.me/?tab=nodeStats&validator_address=${attesterAddress}`}
            target="_blank"
            rel="noreferrer"
            className="hover:font-bold hover:text-purple-light"
          >
            Check out Starfrich's dashboard for even more detailed stats.
          </a>
        </p>

        <DataTable
          isLoading={isLoading}
          data={processedHistory}
          columns={ValidatorHistoryTableColumns}
          disableSizeSelector={disableSizeSelector}
          disablePagination={disablePagination}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
