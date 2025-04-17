import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { useEffect, useState, type FC } from "react";
import { formatDuration } from "~/lib/utils";

interface BlockCountdownProgressProps {
  latestBlocks: ChicmozL2BlockLight[] | undefined;
  averageBlockTime: string | number | undefined | null;
}

export const BlockCountdownProgress: FC<BlockCountdownProgressProps> = ({
  latestBlocks,
  averageBlockTime,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [uiDelayOffset, setUiDelayOffset] = useState<number>(6000);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  useEffect(() => {
    if (
      !latestBlocks?.length ||
      !latestBlocks[0]?.header?.globalVariables?.timestamp
    ) {
      return;
    }

    const latestBlock = latestBlocks[0];
    const blockTimestamp = new Date(
      latestBlock.header.globalVariables.timestamp,
    ).getTime();
    const now = Date.now();

    const calculatedDelay = now - blockTimestamp;
    if (calculatedDelay > 0 && calculatedDelay < 30000) {
      setUiDelayOffset(calculatedDelay);
    }
  }, [latestBlocks]);

  useEffect(() => {
    if (!averageBlockTime || !latestBlocks?.length) {
      return;
    }

    const latestBlock = latestBlocks[0];
    if (!latestBlock.header?.globalVariables?.timestamp) {
      return;
    }

    const avgBlockTimeMs = Number(averageBlockTime);
    const latestBlockTimestamp = new Date(
      latestBlock.header.globalVariables.timestamp,
    ).getTime();
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
  }, [averageBlockTime, latestBlocks, uiDelayOffset]);

  // Get the appropriate fill color class based on progress
  const getFillColorClass = (daprogress: number) => {
    if (isOverdue) {
      return "bg-red";
    }
    if (daprogress < 75) {
      return "bg-yellow";
    }
    return "bg-green";
  };

  // Format the time with +/- 3 second window for "now"
  const getFormattedTimeLeft = () => {
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
          className={`${getFillColorClass(
            progress,
          )} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
