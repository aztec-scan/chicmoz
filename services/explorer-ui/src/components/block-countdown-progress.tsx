import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { useEffect, useMemo, useState, type FC } from "react";
import { formatDuration } from "~/lib/utils";

interface BlockCountdownProgressProps {
  latestBlocks: ChicmozL2BlockLight[] | undefined;
  averageBlockTime: string | number | undefined | null;
}

export const BlockCountdownProgress: FC<BlockCountdownProgressProps> = ({
  latestBlocks,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [uiDelayOffset, setUiDelayOffset] = useState<number>(6000);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  const calculatedAvgBlockTime = useMemo(() => {
    if (!latestBlocks || latestBlocks.length < 2) return null;
    
    const blocks = latestBlocks.slice(0, Math.min(5, latestBlocks.length));
    
    const timeDiffs: number[] = [];
    for (let i = 0; i < blocks.length - 1; i++) {
      const currentBlockTime = new Date(blocks[i].header.globalVariables.timestamp).getTime();
      const nextBlockTime = new Date(blocks[i + 1].header.globalVariables.timestamp).getTime();
      const diff = currentBlockTime - nextBlockTime;
      if (diff > 0) timeDiffs.push(diff);
    }
    
    if (timeDiffs.length === 0) return null;
    return timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  }, [latestBlocks]);

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
    if (!calculatedAvgBlockTime || !latestBlocks?.length) {
      return;
    }

    const latestBlock = latestBlocks[0];
    if (!latestBlock.header?.globalVariables?.timestamp) {
      return;
    }

    const avgBlockTimeMs = calculatedAvgBlockTime;
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
      
      if (now > nextBlockTime + 3000) { // More than 3 seconds past expected time
        percentage = 95 + (Math.sin(Date.now() / 200) + 1) * 2.5;
      }
      
      setProgress(percentage);
    }, 100);

    return () => clearInterval(intervalId);
  }, [calculatedAvgBlockTime, latestBlocks, uiDelayOffset]);

  // Color progression: yellow → green in 4 steps, red only after expected time
  const getFillColor = () => {
    if (isOverdue) return '#ef4444'; // Red when overdue
    
    if (progress < 25) return '#eab308'; // Yellow (start)
    if (progress < 50) return '#a3e635'; // Lime
    if (progress < 75) return '#4ade80'; // Light green
    return '#22c55e'; // Full green (end)
  };

  // Format the time with +/- 3 second window for "now"
  const getFormattedTimeLeft = () => {
    if (timeLeft === null) return "calculating...";
    
    // Within 3 seconds window around expected time, show "now"
    if (timeLeft <= 3000 && !isOverdue) return "now";
    
    if (isOverdue) {
      // More than 3 seconds past expected time
      return `should have arrived ${formatDuration(timeLeft / 1000, true)} ago`;
    }
    
    // Not yet within 3 seconds of expected time
    return `in ${formatDuration(timeLeft / 1000, true)}`;
  };

  return (
    <div style={{ width: '100%', padding: '24px 16px' }}>
      <div style={{
        width: '100%',
        height: '30px',
        backgroundColor: '#d1d5db',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #9ca3af'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: getFillColor(),
          transition: 'width 0.3s ease, background-color 0.5s ease'
        }} />
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#1f2937',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            {`Next block ${getFormattedTimeLeft()}`}
          </span>
        </div>
      </div>
    </div>
  );
};
