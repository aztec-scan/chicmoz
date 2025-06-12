import { ChicmozContractInstanceBalance } from "@chicmoz-pkg/types";
import { type FC, useState } from "react";
import { BalanceAreaChart } from "~/components/charts/balance-area-chart";
import { BalanceHeader } from "./components/balance-header";
import { BalanceStats } from "./components/balance-stats";
import { DateRangeFilter } from "./components/date-range-filter";
import { FilterButton } from "./components/filter-button";
import { useBalanceChartData } from "./hooks/use-balance-chart-data";

interface FeeJuiceBalanceProps {
  historyData: ChicmozContractInstanceBalance[];
}

export const FeeJuiceBalance: FC<FeeJuiceBalanceProps> = ({ historyData }) => {
  // State for date filtering and UI
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Get all processed chart data
  const {
    sortedData,
    filteredData,
    latestBalance,
    chartData,
    minTime,
    maxTime,
    yAxisMin,
    yAxisMax,
    timeFormatter,
    formatTooltipValue,
    formatTooltipLabel,
    minDateForInput,
    maxDateForInput,
  } = useBalanceChartData(historyData, startDate, endDate);

  // Event handlers
  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Early return for empty data
  if (!historyData || historyData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No balance history available for this contract instance.
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current Balance Display */}
      <BalanceHeader
        currentBalance={Number(latestBalance.balance)}
        lastUpdated={latestBalance.timestamp.toString()}
      />

      {/* Chart */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h4 className="text-base md:text-lg font-semibold text-gray-700">
            Balance History
          </h4>
          <FilterButton onClick={toggleFilters} />
        </div>

        {/* Collapsible Date Range Filters */}
        {showFilters && (
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearDateRange}
            minDate={minDateForInput}
            maxDate={maxDateForInput}
            filteredCount={filteredData.length}
            totalCount={sortedData.length}
          />
        )}

        {filteredData.length === 0 && (startDate || endDate) ? (
          <div className="h-64 md:h-80 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium mb-2">No data found</div>
              <div className="text-sm">
                No balance entries found for the selected date range
                {startDate &&
                  ` from ${new Date(startDate).toLocaleDateString()}`}
                {endDate && ` to ${new Date(endDate).toLocaleDateString()}`}
              </div>
              <div className="text-sm mt-2 text-gray-400">
                Try adjusting your date range or clear the filter to see all
                data
              </div>
            </div>
          </div>
        ) : (
          <BalanceAreaChart
            data={chartData}
            minTime={minTime}
            maxTime={maxTime}
            yAxisMin={yAxisMin}
            yAxisMax={yAxisMax}
            timeFormatter={timeFormatter}
            formatTooltipValue={formatTooltipValue}
            formatTooltipLabel={formatTooltipLabel}
          />
        )}
        {/* Summary Stats */}
        {filteredData.length > 0 && (
          <BalanceStats
            totalRecords={filteredData.length}
            peakBalance={Math.max(...chartData.map((d) => d.balance))}
            lowestBalance={Math.min(...chartData.map((d) => d.balance))}
          />
        )}
      </div>
    </div>
  );
};
