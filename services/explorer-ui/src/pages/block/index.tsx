import { type FC, useState, useEffect } from "react";
import { BlocksTable } from "~/components/blocks/blocks-table.tsx";
import { InfoBadge } from "~/components/info-badge";
import { BaseLayout } from "~/layout/base-layout";
import {
  useAvarageBlockTime,
  useAvarageFees,
  useSubTitle,
  useLatestTableBlocks,
  useLatestTableBlocksByHeightRange,
} from "~/hooks";
import { formatDuration } from "~/lib/utils";
import { routes } from "~/routes/__root";

export const Blocks: FC = () => {
  useSubTitle(routes.blocks.children.index.title);

  const { data: latestBlocksData } = useLatestTableBlocks();

  // State for block range
  const [startBlock, setStartBlock] = useState<number | undefined>(undefined);
  const [endBlock, setEndBlock] = useState<number | undefined>(undefined);

  // Set initial range based on latest blocks
  useEffect(() => {
    if (
      latestBlocksData &&
      latestBlocksData.length > 0 &&
      startBlock === undefined &&
      endBlock === undefined
    ) {
      const latestHeight = Number(latestBlocksData[0].height);
      setEndBlock(latestHeight);
      setStartBlock(Math.max(1, latestHeight - 9)); // Show 10 blocks by default
    }
  }, [latestBlocksData, startBlock, endBlock]);

  // Use range-based query once we have a range
  // Add 1 to end value because backend uses exclusive upper bound [from, to)
  const {
    data: rangeBlocks,
    isLoading,
    error,
    refetch,
  } = useLatestTableBlocksByHeightRange(
    startBlock ?? 1,
    endBlock !== undefined ? endBlock + 1 : startBlock ? startBlock + 10 : 11,
  );

  // Refetch when range changes
  useEffect(() => {
    if (startBlock !== undefined && endBlock !== undefined) {
      void refetch();
    }
  }, [startBlock, endBlock, refetch]);

  const handleRangeChange = (start: number, end: number) => {
    setStartBlock(start);
    setEndBlock(end);
  };

  const {
    data: avarageFees,
    isLoading: loadingAvarageFees,
    error: errorAvarageFees,
  } = useAvarageFees();
  const {
    data: avarageBlockTime,
    isLoading: loadingAvarageBlockTime,
    error: errorAvarageBlockTime,
  } = useAvarageBlockTime();

  const averageBlockTimeFormatted = formatDuration(
    Number(avarageBlockTime),
  );

  return (
    <BaseLayout>
      <div className="flex flex-wrap m-5">
        <h2 className="text-primary dark:text-white mt-2 md:hidden">
          Blocks overview
        </h2>
        <h2 className="hidden md:block md:text-primary md:dark:text-white md:mt-8">
          Blocks overview
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 my-10 md:gap-5">
        <InfoBadge
          title="Average fees (FJ)"
          isLoading={loadingAvarageFees}
          error={errorAvarageFees}
          data={avarageFees}
        />
        <InfoBadge
          title="Average block time"
          isLoading={loadingAvarageBlockTime}
          error={errorAvarageBlockTime}
          data={averageBlockTimeFormatted}
        />
      </div>
      <div className="rounded-lg shadow-lg">
        <BlocksTable
          blocks={rangeBlocks}
          isLoading={isLoading}
          error={error}
          showRangeSelector={true}
          startBlock={startBlock}
          endBlock={endBlock}
          onRangeChange={handleRangeChange}
        />
      </div>
    </BaseLayout>
  );
};
