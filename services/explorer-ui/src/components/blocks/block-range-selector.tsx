import { type FC, useState, useEffect } from "react";

interface RangeSelectorProps {
  startBlock?: number;
  endBlock?: number;
  onRangeChange: (start: number, end: number) => void;
}

export const RangeSelector: FC<RangeSelectorProps> = ({
  startBlock,
  endBlock,
  onRangeChange,
}) => {
  const [startInput, setStartInput] = useState(startBlock?.toString() ?? "");
  const [endInput, setEndInput] = useState(endBlock?.toString() ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [, setLastChangedField] = useState<"start" | "end" | null>(null);

  // Update input fields when props change
  useEffect(() => {
    if (startBlock !== undefined) {
      setStartInput(String(startBlock));
    }
    if (endBlock !== undefined) {
      setEndInput(String(endBlock));
    }
  }, [startBlock, endBlock]);

  const handleStartChange = (value: string) => {
    setStartInput(value);
    setLastChangedField("start");

    const startNum = parseInt(value, 10);
    if (!isNaN(startNum) && startNum > 0) {
      // Calculate end block to maintain a 10-block range (start to start+9)
      const calculatedEnd = startNum + 9;
      setEndInput(calculatedEnd.toString());
    }
  };

  const handleEndChange = (value: string) => {
    setEndInput(value);
    setLastChangedField("end");

    const endNum = parseInt(value, 10);
    if (!isNaN(endNum) && endNum > 0) {
      // Calculate start block to maintain a 10-block range (end-9 to end)
      const calculatedStart = Math.max(1, endNum - 9);
      setStartInput(calculatedStart.toString());
    }
  };

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

    // Calculate inclusive block count (end - start + 1)
    const blockCount = end - start + 1;
    if (blockCount > 20) {
      setValidationError("Maximum range is 20 blocks");
      return;
    }

    setValidationError(null);
    onRangeChange(start, end);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row items-start md:items-center gap-2"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <label
              htmlFor="block-range-start"
              className="text-sm font-medium text-gray-700 mr-1"
            >
              From:
            </label>
            <input
              id="block-range-start"
              type="number"
              value={startInput}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Start"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <label
              htmlFor="block-range-end"
              className="text-sm font-medium text-gray-700 mr-1"
            >
              To:
            </label>
            <input
              id="block-range-end"
              type="number"
              value={endInput}
              onChange={(e) => handleEndChange(e.target.value)}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="End"
              min="0"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Apply
          </button>
        </div>

        <div className="flex items-center">
          <span className="text-xs text-gray-500 italic">
            Note: Auto-calculates 10-block range. Maximum range is 20 blocks.
          </span>
        </div>
      </div>

      {validationError && (
        <p className="text-red-500 text-xs mt-1 md:mt-0">{validationError}</p>
      )}
    </form>
  );
};
