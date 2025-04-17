import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { useEffect, useState, type FC } from "react";
import { InfoBadge } from "~/components/info-badge";
import { formatDuration } from "~/lib/utils";

interface NextBlockCountdownProps {
  latestBlocks: ChicmozL2BlockLight[] | undefined;
  averageBlockTime: string | number | undefined | null;
  isLoading: boolean;
  error: Error | null;
}

export const NextBlockCountdown: FC<NextBlockCountdownProps> = ({
  latestBlocks,
  averageBlockTime,
  isLoading,
  error,
}) => {
  // State for the next block countdown
  const [nextBlockCountdown, setNextBlockCountdown] = useState<string | null>(
    null,
  );

  // State to store UI delay offset (default: 6000ms = 6 seconds)
  const [uiDelayOffset, setUiDelayOffset] = useState<number>(6000);

  // Calculate and update UI delay offset when new blocks arrive
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

    // Calculate how much delay there is between block timestamp and UI detection
    // Only update if the delay is reasonable (to avoid outliers)
    const calculatedDelay = now - blockTimestamp;
    if (calculatedDelay > 0 && calculatedDelay < 30000) {
      // Ignore if > 30 seconds
      setUiDelayOffset(calculatedDelay);
    }
  }, [latestBlocks]);

  // Set up countdown timer for next expected block
  useEffect(() => {
    // Only proceed if we have average block time and latest blocks
    if (!averageBlockTime || !latestBlocks?.length) {
      return;
    }

    const latestBlock = latestBlocks[0];
    if (!latestBlock.header?.globalVariables?.timestamp) {
      return;
    }

    // Convert average block time to milliseconds
    const avgBlockTimeMs = Number(averageBlockTime);

    // Calculate expected next block time based on latest block timestamp
    // Add the UI delay offset to account for network/processing delays
    const latestBlockTimestamp = new Date(
      latestBlock.header.globalVariables.timestamp,
    ).getTime();
    const expectedNextBlockTime =
      latestBlockTimestamp + avgBlockTimeMs + uiDelayOffset;

    // Set up interval to update countdown every second
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeLeftMs = expectedNextBlockTime - now;

      // Format the countdown time, allowing negative values
      let formattedTime = formatDuration(Math.abs(timeLeftMs) / 1000, true);
      if (formattedTime === "just now") {
        formattedTime = "now";
      } else if (timeLeftMs < 0) {
        formattedTime = `-${formattedTime}`;
      }
      setNextBlockCountdown(formattedTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [averageBlockTime, latestBlocks, uiDelayOffset]);

  // Format average block time for display
  const averageBlockTimeFormatted = averageBlockTime
    ? formatDuration(Number(averageBlockTime) / 1000, true)
    : "calculating...";

  return (
    <InfoBadge
      title={`Next expected block (avg. ${averageBlockTimeFormatted})`}
      isLoading={isLoading || !nextBlockCountdown}
      error={error}
      data={nextBlockCountdown ?? "Calculating..."}
    />
  );
};
