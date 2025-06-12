import { type FC } from "react";

interface BalanceStatsProps {
  totalRecords: number;
  peakBalance: number;
  lowestBalance: number;
}

export const BalanceStats: FC<BalanceStatsProps> = ({
  totalRecords,
  peakBalance,
  lowestBalance,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4 text-center">
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Total Records
        </div>
        <div className="text-sm md:text-xl font-semibold text-gray-700 dark:text-gray-200">
          {totalRecords}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4 text-center">
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Peak Balance
        </div>
        <div className="text-sm md:text-xl font-semibold text-gray-700 dark:text-gray-200">
          {peakBalance.toLocaleString()}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4 text-center">
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Lowest Balance
        </div>
        <div className="text-sm md:text-xl font-semibold text-gray-700 dark:text-gray-200">
          {lowestBalance.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

