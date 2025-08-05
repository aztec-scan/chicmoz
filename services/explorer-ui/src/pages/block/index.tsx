import { type FC, useState, useEffect } from "react";
import { BlocksTable } from "~/components/blocks/blocks-table.tsx";
import { InfoBadge } from "~/components/info-badge";
import { BaseLayout } from "~/layout/base-layout";
import {
  useAvarageBlockTime,
  useAvarageFees,
  useSubTitle,
  usePaginatedTableBlocks,
  useLatestTableBlocks,
  useLatestTableBlocksByHeightRange,
} from "~/hooks";
import { formatDuration } from "~/lib/utils";
import { routes } from "~/routes/__root";

export const Blocks: FC = () => {
  useSubTitle(routes.blocks.children.index.title);

  const { data: latestBlocksData } = useLatestTableBlocks();

  // State for block range (for range selector)
  const [startBlock, setStartBlock] = useState<number | undefined>(undefined);
  const [endBlock, setEndBlock] = useState<number | undefined>(undefined);

  // State for React Query pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [useRangeMode, setUseRangeMode] = useState<boolean>(false);

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
      setStartBlock(Math.max(1, latestHeight - 19)); // Show 20 blocks by default
    }
  }, [latestBlocksData, startBlock, endBlock]);

  // Use range-based query when range selector is used
  const {
    data: rangeBlocks,
    isLoading: rangeLoading,
    error: rangeError,
    refetch: rangeRefetch,
  } = useLatestTableBlocksByHeightRange(
    startBlock ?? 1,
    endBlock !== undefined ? endBlock + 1 : startBlock ? startBlock + 20 : 21,
  );

  // Use paginated query for React Query pagination
  const {
    data: paginatedBlocks,
    isLoading: paginatedLoading,
    error: paginatedError,
  } = usePaginatedTableBlocks(currentPage, pageSize);

  // Refetch when range changes
  useEffect(() => {
    if (startBlock !== undefined && endBlock !== undefined) {
      void rangeRefetch();
    }
  }, [startBlock, endBlock, rangeRefetch]);

  const handleRangeChange = (start: number, end: number) => {
    setStartBlock(start);
    setEndBlock(end);
    setUseRangeMode(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setUseRangeMode(false); // Switch to pagination mode
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
    setUseRangeMode(false); // Switch to pagination mode
  };

  // Choose which data to display
  const blocks = useRangeMode ? rangeBlocks : paginatedBlocks;
  const isLoading = useRangeMode ? rangeLoading : paginatedLoading;
  const error = useRangeMode ? rangeError : paginatedError;

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

  const averageBlockTimeFormatted = formatDuration(Number(avarageBlockTime));

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
          blocks={blocks}
          isLoading={isLoading}
          error={error}
          showRangeSelector={true}
          startBlock={startBlock}
          endBlock={endBlock}
          onRangeChange={handleRangeChange}
          disablePagination={useRangeMode}
          maxEntries={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          useReactQueryPagination={!useRangeMode}
        />
      </div>{" "}
    </BaseLayout>
  );
};
