import { type FC } from "react";

interface BalanceHeaderProps {
  currentBalance: number;
  lastUpdated: string;
}

export const BalanceHeader: FC<BalanceHeaderProps> = ({
  currentBalance,
  lastUpdated,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 md:p-6 border border-blue-100">
      <div className="text-center">
        <h3 className="text-sm md:text-lg font-semibold text-gray-700 mb-2">
          Current Fee Juice Balance
        </h3>
        <div className="text-sm md:text-3xl font-bold text-primary">
          {currentBalance.toLocaleString()}
        </div>
        <div className="text-xs md:text-sm text-gray-500 mt-1">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};