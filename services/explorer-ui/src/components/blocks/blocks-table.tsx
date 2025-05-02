import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { BlockTableColumns } from "./block-table-columns";
import { type BlockTableSchema } from "./blocks-schema";
import { RangeSelector } from "./block-range-selector";

interface Props {
  title?: string;
  blocks?: BlockTableSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  showRangeSelector?: boolean;
  startBlock?: number;
  endBlock?: number;
  onRangeChange?: (start: number, end: number) => void;
}

export const BlocksTable: FC<Props> = ({
  title,
  blocks,
  isLoading,
  error,
  disableSizeSelector,
  showRangeSelector = false,
  startBlock,
  endBlock,
  onRangeChange,
}) => {
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }

  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        <div className="flex flex-col md:flex-row gap-3 justify-between md:min-h-16 items-start md:items-center">
          {title && <h3 className="ml-0.5">{title}</h3>}

          {showRangeSelector && onRangeChange && (
            <RangeSelector
              startBlock={startBlock}
              endBlock={endBlock}
              onRangeChange={onRangeChange}
            />
          )}
        </div>

        <DataTable
          isLoading={isLoading}
          data={blocks ?? []}
          columns={BlockTableColumns}
          disableSizeSelector={disableSizeSelector}
        />
      </div>
    </section>
  );
};
