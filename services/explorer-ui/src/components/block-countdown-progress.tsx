import { type UiBlockTable } from "@chicmoz-pkg/types";
import { useEffect, useState, type FC } from "react";
import { useTabVisibility } from "~/hooks/useTabVisibility";
import { useWebSocketConnection } from "~/hooks/websocket";
import { formatDuration } from "~/lib/utils";

interface BlockCountdownProgressProps {
  latestBlocks: UiBlockTable[] | undefined;
  averageBlockTimeMs: string | number | null;
}

export const BlockCountdownProgress: FC<BlockCountdownProgressProps> = ({
  latestBlocks,
  averageBlockTimeMs,
}) => {
  const isTabActive = useTabVisibility();
  const wsConnectionState = useWebSocketConnection();
  const [progress, setProgress] = useState<number>(0);
  const [uiDelayOffset, setUiDelayOffset] = useState<number>(6000);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  useEffect(() => {
    if (!latestBlocks?.length || !latestBlocks[0]?.timestamp) {
      return;
    }

    const latestBlock = latestBlocks[0];
    const blockTimestamp = latestBlock.timestamp;
    const now = Date.now();

    const calculatedDelay = now - blockTimestamp;
    if (calculatedDelay > 0 && calculatedDelay < 30000) {
      setUiDelayOffset(calculatedDelay);
    }
  }, [latestBlocks]);

  useEffect(() => {
    if (!averageBlockTimeMs || !latestBlocks?.length) {
      return;
    }

    const latestBlock = latestBlocks[0];
    if (!latestBlock.timestamp) {
      return;
    }

    const avgBlockTimeMs = Number(averageBlockTimeMs);
    const latestBlockTimestamp = latestBlock.timestamp;
    const nextBlockTime = latestBlockTimestamp + avgBlockTimeMs + uiDelayOffset;

    const intervalId = setInterval(() => {
      const now = Date.now();

      const totalDuration = avgBlockTimeMs;
      const elapsed = now - latestBlockTimestamp;
      const remaining = nextBlockTime - now;

      setTimeLeft(Math.abs(remaining));
      setIsOverdue(remaining < -3000); // Only consider overdue if more than 3 seconds past expected time

      let percentage = Math.min(100, (elapsed / totalDuration) * 100);

      if (now > nextBlockTime + 3000) {
        // More than 3 seconds past expected time
        percentage = 95 + (Math.sin(Date.now() / 200) + 1) * 2.5;
      }

      setProgress(percentage);
    }, 100);

    return () => clearInterval(intervalId);
  }, [averageBlockTimeMs, latestBlocks, uiDelayOffset]);

  // Get the appropriate fill color class based on progress
  const getFillColorClass = () => {
    if (!isTabActive || wsConnectionState !== "OPEN") {
      return "bg-gray-400"; // Use a neutral color for inactive/disconnected state
    }

    if (isOverdue) {
      return "bg-red";
    }
    if (progress < 75) {
      return "bg-yellow";
    }
    return "bg-green";
  };

  // Format the time with +/- 3 second window for "now"
  const getFormattedTimeLeft = () => {
    // First check connection status
    if (!isTabActive) {
      return "waiting - tab inactive";
    }

    if (wsConnectionState !== "OPEN") {
      return `waiting - websocket ${wsConnectionState.toLowerCase()}`;
    }

    if (timeLeft === null) {
      return "calculating...";
    }

    if (timeLeft <= 3000 && !isOverdue) {
      return "now";
    }

    if (isOverdue) {
      return `should have arrived ${formatDuration(timeLeft / 1000, true)} ago`;
    }

    return `in ${formatDuration(timeLeft / 1000, true)}`;
  };

  return (
    <div className="w-full px-4 py-6 text-gray-500">
      {`Expected next block ${getFormattedTimeLeft()}`}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-3">
        <div
          className={`${getFillColorClass()} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
