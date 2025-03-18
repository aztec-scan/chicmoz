import { type FC } from "react";
import { BlocksTable } from "~/components/blocks/blocks-table.tsx";
import { InfoBadge } from "~/components/info-badge";
import {
  useAvarageBlockTime,
  useAvarageFees,
  useLatestBlocks,
  useSubTitle,
} from "~/hooks";
import { mapLatestBlocks } from "~/lib/map-for-table";
import { formatDuration } from "~/lib/utils";
import { routes } from "~/routes/__root";

export const Blocks: FC = () => {
  useSubTitle(routes.blocks.children.index.title);
  const { data: latestBlocks, isLoading, error } = useLatestBlocks();
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
    Number(avarageBlockTime) / 1000
  );

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap m-5">
        <h2 className="mt-2 text-primary md:hidden">Blocks overview</h2>
        <h1 className="hidden md:block md:text-primary md:mt-8">Blocks overview</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 my-10 md:gap-5 ">
        <InfoBadge
          title="Average fees (FPA)"
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
          blocks={mapLatestBlocks(latestBlocks)}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};
