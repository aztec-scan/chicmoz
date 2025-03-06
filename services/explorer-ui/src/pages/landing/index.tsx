import { useMemo, type FC } from "react";
import { BlocksTable } from "~/components/blocks/blocks-table";
import { InfoBadge } from "~/components/info-badge";
import { type TxEffectTableSchema } from "~/components/tx-effects/tx-effects-schema";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import {
  HealthStatus,
  useAvarageBlockTime,
  useAvarageFees,
  useGetLatestTxEffects,
  useLatestBlocks,
  usePendingTxs,
  useSubTitle,
  useSystemHealth,
  useTotalContracts,
  useTotalContractsLast24h,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks";
import { mapLatestBlocks, mapLatestTxEffects } from "~/lib/map-for-table";
import { formatDuration, formatFees } from "~/lib/utils";
import { routes } from "~/routes/__root";

export const Landing: FC = () => {
  const { systemHealth } = useSystemHealth();
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

  useSubTitle(latestBlocks?.[0]?.height.toString() ?? routes.home.title);

  const {
    data: latestTxEffectsData,
    isLoading: isLoadingTxEffects,
    error: txEffectsError,
  } = useGetLatestTxEffects();

  const { data: pendingTxs } = usePendingTxs();

  const latestTxEffectsWithPending = useMemo(() => {
    if (!latestTxEffectsData) {
      return [];
    }
    if (!latestBlocks) {
      return [];
    }
    const disguisedPendingTxs =
      pendingTxs?.reduce((acc, tx) => {
        if (!latestTxEffectsData.some((effect) => effect.txHash === tx.hash)) {
          acc.push({
            txHash: tx.hash,
            transactionFee: -1,
            blockNumber: -1,
            timestamp: tx.birthTimestamp ?? 0,
          });
        }
        return acc;
      }, [] as TxEffectTableSchema[]) ?? [];
    return [
      ...disguisedPendingTxs,
      ...mapLatestTxEffects(latestTxEffectsData, latestBlocks),
    ];
  }, [pendingTxs, latestTxEffectsData, latestBlocks]);

  const averageBlockTimeFormatted = formatDuration(
    Number(avarageBlockTime) / 1000,
    true,
  );

  const formattedFees = formatFees(avarageFees);

  const isAnyComponentLoading =
    isLoading ||
    loadingTotalEffects ||
    loadingTotalEffects24h ||
    loadingAvarageFees ||
    loadingAmountContracts ||
    loadingAmountContracts24h ||
    loadingAvarageBlockTime ||
    isLoadingTxEffects;
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

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      {isConclusivlyDown && (
        <div className="flex flex-col bg-white w-full h-96 justify-between rounded-lg shadow-md mt-20">
          <div className="flex flex-col items-center justify-center h-full">
            <h3>System is down</h3>
            <p>{systemHealth.reason}</p>
          </div>
        </div>
      )}
      {!isConclusivlyDown && (
        <>
          <div className="hidden md:mt-16 md:flex flex-wrap justify-center my-20">
            <h1 className="">Explore the power of privacy on Aztec</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 my-20 md:grid-cols-3 md:gap-5">
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
              title={`Average fees (${formattedFees.denomination} FPA)`}
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
              data={averageBlockTimeFormatted}
            />
          </div>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
              <BlocksTable
                title="Latest Blocks"
                blocks={mapLatestBlocks(latestBlocks)}
                isLoading={isLoading}
                error={error}
                disableSizeSelector={true}
              />
            </div>
            <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
              <TxEffectsTable
                title="Latest TX-Effects"
                txEffects={latestTxEffectsWithPending}
                isLoading={isLoadingTxEffects}
                error={txEffectsError}
                disableSizeSelector={true}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
