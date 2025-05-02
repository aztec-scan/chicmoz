import { type FC, useState, useEffect } from "react";
import { DataTable } from "~/components/data-table";
import { BlockTableColumns } from "./block-table-columns";
import { type BlockTableSchema } from "./blocks-schema";

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
  const [startInput, setStartInput] = useState(startBlock?.toString() ?? "");
  const [endInput, setEndInput] = useState(endBlock?.toString() ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update input fields when props change
  useEffect(() => {
    if (startBlock !== undefined) {
      setStartInput(String(startBlock));
    }
    if (endBlock !== undefined) {
      setEndInput(String(endBlock));
    }
  }, [startBlock, endBlock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(startInput, 10);
    const end = parseInt(endInput, 10);

    if (isNaN(start) || isNaN(end)) {
      setValidationError("Please enter valid block numbers");
      return;
    }

    if (start > end) {
      setValidationError("Start block must be less than or equal to end block");
      return;
    }

    setValidationError(null);
    if (onRangeChange) {
      onRangeChange(start, end);
    }
  };

  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }

  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        <div className="flex flex-col md:flex-row gap-3 justify-between md:min-h-16 items-start md:items-center">
          {title && <h3 className="ml-0.5">{title}</h3>}

          {showRangeSelector && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row items-start md:items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Block Range:
                </label>
                <input
                  type="number"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Start"
                  min="0"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="End"
                  min="0"
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Apply
                </button>
              </div>
              {validationError && (
                <p className="text-red-500 text-xs mt-1 md:mt-0">
                  {validationError}
                </p>
              )}
            </form>
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
