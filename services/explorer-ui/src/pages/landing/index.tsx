import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { BlockCountdownProgress } from "~/components/block-countdown-progress";
import { BlocksTable } from "~/components/blocks/blocks-table";
import { InfoBadge } from "~/components/info-badge";
import { PendingTxsTable } from "~/components/pending-txs/pending-txs-table";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import {
  HealthStatus,
  useAvarageBlockTime,
  useAvarageFees,
  useLatestTableBlocks,
  useLatestTableTxEffects,
  usePendingTxs,
  useSubTitle,
  useSystemHealth,
  useTotalContracts,
  useTotalContractsLast24h,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks";
import { formatDuration, formatFees } from "~/lib/utils";
import { routes } from "~/routes/__root";

export const Landing: FC = () => {
  const { systemHealth } = useSystemHealth();
  const { data: latestBlocks, isLoading, error } = useLatestTableBlocks();
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
    data: avarageFees,
    isLoading: loadingAvarageFees,
    error: errorAvarageFees,
  } = useAvarageFees();
  const {
    data: totalAmountOfContracts,
    isLoading: loadingAmountContracts,
    error: errorAmountContracts,
  } = useTotalContracts();
  const {
    data: totalAmountOfContracts24h,
    isLoading: loadingAmountContracts24h,
    error: errorAmountContracts24h,
  } = useTotalContractsLast24h();
  const {
    data: avarageBlockTime,
    isLoading: loadingAvarageBlockTime,
    error: errorAvarageBlockTime,
  } = useAvarageBlockTime();

  // For latest transactions
  const {
    data: latestTxEffectsData,
    isLoading: isLoadingTxEffects,
    error: txEffectsError,
  } = useLatestTableTxEffects();

  // For pending transactions
  const {
    data: pendingTxsData,
    isLoading: isLoadingPendingTxs,
    error: pendingTxsError,
  } = usePendingTxs();

  const formattedFees = formatFees(avarageFees);

  const isAnyComponentLoading =
    isLoading ||
    loadingTotalEffects ||
    loadingTotalEffects24h ||
    loadingAvarageFees ||
    loadingAmountContracts ||
    loadingAmountContracts24h ||
    loadingAvarageBlockTime;

  const isThereAnyComponentData =
    (latestBlocks?.length ?? 0) > 0 ||
    !!totalTxEffects ||
    !!totalTxEffects24h ||
    !!avarageFees ||
    !!totalAmountOfContracts ||
    !!totalAmountOfContracts24h ||
    !!avarageBlockTime;
  const isConclusivlyDown =
    systemHealth.health === HealthStatus.DOWN &&
    !isAnyComponentLoading &&
    !isThereAnyComponentData;

  let title = routes.home.title;
  if (isConclusivlyDown) {
    title = "Aztecscan: DOWN";
  }
  if (latestBlocks?.[0]?.height) {
    title = `Aztecscan: ${latestBlocks[0].height}`;
  }
  useSubTitle(title);

  const showBlockCountdownProgress =
    !loadingAvarageBlockTime && !isLoading && latestBlocks && avarageBlockTime;
  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      {isConclusivlyDown && (
        <div className="flex flex-col bg-white w-full h-96 justify-between rounded-lg shadow-md mt-20">
          <div className="flex flex-col items-center justify-center h-full">
            <h3>System is down</h3>
            <Link
              to={routes.aztecscanHealth.route}
              className="text-primary dark:text-white underline"
            >
              Check health page for details
            </Link>
          </div>
        </div>
      )}
      {!isConclusivlyDown && (
        <>
          <div className=" flex flex-wrap justify-center my-14 md:my-20">
            <h1 className="hidden md:block md:text-primary md:dark:text-white">
              Explore the power of privacy on Aztec
            </h1>
            <h5 className="text-primary dark:text-white md:hidden">
              Explore the power of privacy on Aztec
            </h5>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-14 mb-10 md:mt-20 md:mb-10 md:grid-cols-3 md:gap-5">
            <InfoBadge
              title="Total transactions"
              isLoading={loadingTotalEffects}
              error={errorTotalEffects}
              data={totalTxEffects}
            />
            <InfoBadge
              title="Total Contract Classes"
              isLoading={loadingAmountContracts}
              error={errorAmountContracts}
              data={totalAmountOfContracts}
            />
            <InfoBadge
              title={`Average fees (${formattedFees.denomination} FJ)`}
              isLoading={loadingAvarageFees}
              error={errorAvarageFees}
              data={formattedFees.value}
            />
            <InfoBadge
              title="Total transactions last 24h"
              isLoading={loadingTotalEffects24h}
              error={errorTotalEffects24h}
              data={totalTxEffects24h}
            />
            <InfoBadge
              title="Total Contract Classes last 24h"
              isLoading={loadingAmountContracts24h}
              error={errorAmountContracts24h}
              data={totalAmountOfContracts24h}
            />
            <InfoBadge
              title="Average block time"
              isLoading={loadingAvarageBlockTime}
              error={errorAvarageBlockTime}
              data={
                avarageBlockTime
                  ? formatDuration(Number(avarageBlockTime) / 1000, true)
                  : "calculating..."
              }
            />
          </div>
          {showBlockCountdownProgress && (
            <div>
              <BlockCountdownProgress
                latestBlocks={latestBlocks}
                averageBlockTime={avarageBlockTime}
              />
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
              <BlocksTable
                title="Latest Blocks"
                blocks={latestBlocks}
                isLoading={isLoading}
                error={error}
                disableSizeSelector={true}
                disablePagination={true}
                maxEntries={20}
              />
              <Link
                to={routes.blocks.route}
                className="text-primary dark:text-white underline text-center block p-4"
              >
                View all Blocks
              </Link>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-1/2">
              <div className="bg-white rounded-lg shadow-lg">
                <TxEffectsTable
                  txEffects={latestTxEffectsData}
                  isLoading={isLoadingTxEffects}
                  title="Latest Transactions"
                  error={txEffectsError}
                  disableSizeSelector={true}
                  disablePagination={true}
                  maxEntries={8}
                />
                <Link
                  to={routes.txEffects.route}
                  className="text-primary dark:text-white underline text-center block p-4"
                >
                  View all Transactions
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-lg">
                <PendingTxsTable
                  title="Pending Transactions"
                  pendingTxEffects={pendingTxsData}
                  isLoading={isLoadingPendingTxs}
                  error={pendingTxsError}
                  disableSizeSelector={true}
                  disablePagination={true}
                  maxEntries={7}
                />
                <Link
                  to={routes.txEffects.route}
                  className="text-primary dark:text-white underline text-center block p-4"
                >
                  View all Pending Transactions
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
