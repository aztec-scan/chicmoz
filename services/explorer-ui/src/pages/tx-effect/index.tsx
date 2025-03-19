import { type FC } from "react";
import { InfoBadge } from "~/components/info-badge";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import {
  useGetLatestTxEffects,
  useLatestBlocks,
  useSubTitle,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks";
import { mapLatestTxEffects } from "~/lib/map-for-table";
import { routes } from "~/routes/__root";

export const TxEffects: FC = () => {
  useSubTitle(routes.txEffects.children.index.title);
  const { data: latestBlocks, isLoading, error } = useLatestBlocks();
  const {
    data: totalTxEffects,
    isLoading: loadingTotalEffects,
    error: errorTotalEffects,
  } = useTotalTxEffects();
  const {
    data: totalTxEffects24h,
    isLoading: loadingTotalEffects24h,
    error: errorTotalEffects24h,
  } = useTotalTxEffectsLast24h();

  const {
    data: latestTxEffectsData,
    isLoading: isLoadingTxEffects,
    error: txEffectsError,
  } = useGetLatestTxEffects();

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap m-5">
        <h2 className="mt-2 text-primary dark:text-white md:hidden">All transaction effects</h2>
        <h2 className="hidden md:text-primary md:dark:text-white md:block md:mt-8">All Tx transaction effects</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 my-10 md:gap-5 ">
        <InfoBadge
          title="Total transactions"
          isLoading={loadingTotalEffects}
          error={errorTotalEffects}
          data={totalTxEffects}
        />
        <InfoBadge
          title="Total transactions last 24h"
          isLoading={loadingTotalEffects24h}
          error={errorTotalEffects24h}
          data={totalTxEffects24h}
        />
      </div>
      <div className="rounded-lg shadow-lg">
        {latestTxEffectsData && latestBlocks ? (
          <TxEffectsTable
            txEffects={mapLatestTxEffects(latestTxEffectsData, latestBlocks)}
            isLoading={isLoading || isLoadingTxEffects}
            error={error ?? txEffectsError}
          />
        ) : (
          <div>No data</div>
        )}
      </div>
    </div>
  );
};
