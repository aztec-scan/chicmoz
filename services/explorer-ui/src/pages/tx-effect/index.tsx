import { type FC } from "react";
import { InfoBadge } from "~/components/info-badge";
import { Loader } from "~/components/loader";
import { PendingTxsTable } from "~/components/pending-txs/pending-txs-table";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import {
  useLatestTableTxEffects,
  usePendingTxs,
  useSubTitle,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks";
import { routes } from "~/routes/__root";

export const TxEffects: FC = () => {
  useSubTitle(routes.txEffects.children.index.title);
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
  } = useLatestTableTxEffects();

  const {
    data: pendingTxsData,
    isLoading: isLoadingPendingTxs,
    error: pendingTxsError,
  } = usePendingTxs();

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap m-5">
        <h2 className="mt-2 text-primary dark:text-white md:hidden">
          All Transactions
        </h2>
        <h2 className="hidden md:text-primary md:dark:text-white md:block md:mt-8">
          All Transactions
        </h2>
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
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
          <TxEffectsTable
            title="Transactions"
            txEffects={latestTxEffectsData}
            isLoading={isLoadingTxEffects}
            error={txEffectsError}
          />
        </div>
        <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
          {pendingTxsData ? (
            <PendingTxsTable
              title="Pending Transactions"
              pendingTxEffects={pendingTxsData}
              isLoading={isLoadingPendingTxs}
              error={pendingTxsError}
              disableSizeSelector={true}
            />
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <Loader amount={3} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
