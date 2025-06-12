import { useMemo } from "react";
import { ChicmozContractInstanceBalance } from "@chicmoz-pkg/types";

interface ChartDataPoint {
  timestamp: number;
  balance: number;
  formattedTime: string;
}

export const useBalanceChartData = (
  historyData: ChicmozContractInstanceBalance[],
  startDate: string,
  endDate: string,
) => {
  return useMemo(() => {
    // Sort data by timestamp to ensure chronological order
    const sortedData = [...historyData].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Filter data based on date range
    const filteredData = (() => {
      if (!startDate && !endDate) return sortedData;

      return sortedData.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate + "T23:59:59") : null; // Include end of day

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    })();

    // Get latest balance from filtered data or original data if no filter
    const latestBalance =
      filteredData.length > 0
        ? filteredData[filteredData.length - 1]
        : sortedData[sortedData.length - 1];

    // Prepare data for chart
    const chartData: ChartDataPoint[] = filteredData.map((item) => ({
      timestamp: new Date(item.timestamp).getTime(),
      balance: Number(item.balance),
      formattedTime: new Date(item.timestamp).toLocaleString(),
    }));

    // Calculate data ranges for adaptive scaling
    const balances = chartData.map((d) => d.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const balanceRange = maxBalance - minBalance;

    // Add padding to Y-axis (10% on each side)
    const yAxisPadding = balanceRange * 0.1;
    const yAxisMin = Math.max(0, minBalance - yAxisPadding);
    const yAxisMax = maxBalance + yAxisPadding;

    // Calculate time range
    const timestamps = chartData.map((d) => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeSpan = maxTime - minTime;

    // Determine appropriate time formatting based on data span
    const timeSpanHours = timeSpan / (1000 * 60 * 60);
    const timeSpanDays = timeSpanHours / 24;

    const getTimeFormatter = () => {
      if (timeSpanHours < 24) {
        // Less than 1 day - show hours
        return (timestamp: number) =>
          new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
      } else if (timeSpanDays < 7) {
        // Less than 1 week - show day and time
        return (timestamp: number) =>
          new Date(timestamp).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
          });
      } else if (timeSpanDays < 30) {
        // Less than 1 month - show date
        return (timestamp: number) =>
          new Date(timestamp).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });
      } else {
        // More than 1 month - show month/year
        return (timestamp: number) =>
          new Date(timestamp).toLocaleDateString([], {
            month: "short",
            year: "numeric",
          });
      }
    };

    const timeFormatter = getTimeFormatter();

    const formatTooltipValue = (value: number) => {
      return [`${value.toLocaleString()} Fee Juice`, "Balance"];
    };

    const formatTooltipLabel = (timestamp: number) => {
      return new Date(timestamp).toLocaleString();
    };

    // Get min and max dates for input constraints
    const minDateForInput =
      sortedData.length > 0
        ? new Date(sortedData[0].timestamp).toISOString().split("T")[0]
        : "";
    const maxDateForInput =
      sortedData.length > 0
        ? new Date(sortedData[sortedData.length - 1].timestamp)
            .toISOString()
            .split("T")[0]
        : "";

    return {
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
    };
  }, [historyData, startDate, endDate]);
};

