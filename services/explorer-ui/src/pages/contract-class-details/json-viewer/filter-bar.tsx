import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";

interface FilterBarProps {
  onFilterChange: (filter: string) => void;
}

export const FilterBar: FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState("");

  // Debounce the filter change to avoid excessive re-rendering
  const debouncedFilterChange = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(() => {
        onFilterChange(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [onFilterChange],
  );

  useEffect(() => {
    const cleanup = debouncedFilterChange(filter);
    return cleanup;
  }, [filter, debouncedFilterChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleClear = () => {
    setFilter("");
    onFilterChange("");
  };

  return (
    <div className="relative flex-grow">
      <input
        type="text"
        placeholder="Filter JSON (e.g., 'function', 'vote', etc.)"
        className="w-full p-2 pl-8 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
        value={filter}
        onChange={handleChange}
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {filter && (
        <button
          className="absolute inset-y-0 right-0 flex items-center pr-2"
          onClick={handleClear}
        >
          <svg
            className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
