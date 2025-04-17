import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FC } from "react";
import { BlocksTable } from "~/components/blocks/blocks-table";
import { InfoBadge } from "~/components/info-badge";
import {
  HealthStatus,
  useAvarageBlockTime,
  useAvarageFees,
  useLatestBlocks,
  useSubTitle,
  useSystemHealth,
  useTotalContracts,
  useTotalContractsLast24h,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks";
import { mapLatestBlocks } from "~/lib/map-for-table";
import { formatDuration, formatFees } from "~/lib/utils";
import { routes } from "~/routes/__root";
import { TxEffectTableLanding } from "./tx-effect-table-landing";

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

  const averageBlockTimeFormatted = formatDuration(
    Number(avarageBlockTime) / 1000,
    true,
  );

  // Add state for the next block countdown
  const [nextBlockCountdown, setNextBlockCountdown] = useState<string | null>(
    null,
  );

  // Set up countdown timer for next expected block
  useEffect(() => {
    // Only proceed if we have average block time and latest blocks
    if (!avarageBlockTime || !latestBlocks?.length) {
      return;
    }

    const latestBlock = latestBlocks[0];
    if (!latestBlock.header.globalVariables.timestamp) {
      return;
    }

    // Convert average block time to milliseconds
    const avgBlockTimeMs = Number(avarageBlockTime);

    // Calculate expected next block time based on latest block timestamp
    const latestBlockTimestamp = new Date(
      latestBlock.header.globalVariables.timestamp,
    ).getTime();
    const expectedNextBlockTime = latestBlockTimestamp + avgBlockTimeMs;

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
  }, [avarageBlockTime, latestBlocks]);

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
          <div className="grid grid-cols-2 gap-3 my-14 md:my-20 md:grid-cols-3 md:gap-5">
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
              title={`Next expected block (avg. ${averageBlockTimeFormatted})`}
              isLoading={loadingAvarageBlockTime || !nextBlockCountdown}
              error={errorAvarageBlockTime}
              data={nextBlockCountdown ?? "Calculating..."}
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
              <TxEffectTableLanding latestBlocks={latestBlocks} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
