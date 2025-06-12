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
      <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 text-center">
        <div className="text-xs md:text-sm text-gray-500">Total Records</div>
        <div className="text-sm md:text-xl font-semibold text-gray-700">
          {totalRecords}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 text-center">
        <div className="text-xs md:text-sm text-gray-500">Peak Balance</div>
        <div className="text-sm md:text-xl font-semibold text-gray-700">
          {peakBalance.toLocaleString()}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 text-center">
        <div className="text-xs md:text-sm text-gray-500">Lowest Balance</div>
        <div className="text-sm md:text-xl font-semibold text-gray-700">
          {lowestBalance.toLocaleString()}
        </div>
      </div>
    </div>
  );
};