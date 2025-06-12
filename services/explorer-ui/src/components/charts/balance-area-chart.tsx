import { type FC, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDataPoint {
  timestamp: number;
  balance: number;
  formattedTime: string;
}

interface BalanceAreaChartProps {
  data: ChartDataPoint[];
  minTime: number;
  maxTime: number;
  yAxisMin: number;
  yAxisMax: number;
  timeFormatter: (timestamp: number) => string;
  formatTooltipValue: (value: number) => string[];
  formatTooltipLabel: (timestamp: number) => string;
}

export const BalanceAreaChart: FC<BalanceAreaChartProps> = ({
  data,
  minTime,
  maxTime,
  yAxisMin,
  yAxisMax,
  timeFormatter,
  formatTooltipValue,
  formatTooltipLabel,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} dataKey={"balance"}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={"#715EC2 "} stopOpacity={0.3} />
              <stop offset="95%" stopColor="#715EC2 " stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={[minTime, maxTime]}
            tickFormatter={timeFormatter}
            tick={{ fontSize: 10 }}
            className="text-xs"
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            tick={false}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Balance",
              angle: -90,
              position: "Left",
              style: {
                textAnchor: "middle",
                fontSize: "18px",
                fill: isDark ? "#9ca3af" : "#6b7280",
              },
            }}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "white",
              border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              color: isDark ? "#e5e7eb" : "#374151",
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#715EC2"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            dot={{ fill: "#715EC2", strokeWidth: 1, r: 2 }}
            activeDot={{ r: 5, fill: "#715EC2", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
