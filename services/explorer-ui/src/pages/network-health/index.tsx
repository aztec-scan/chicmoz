import { useMemo, type FC } from "react";
import { InfoBadge } from "~/components/info-badge";
import { useGetLatestTxEffects, useSubTitle } from "~/hooks";
import { useBlocksByNativeStatus, useReorgs } from "~/hooks/api/blocks";
import { useValidatorTotals } from "~/hooks/api/l1-l2-validator";
import { BaseLayout } from "~/layout/base-layout";
import { BlockProductionSection } from "./block-production-section";
import { NativeStatusSection } from "./native-status-section";
import { OrphanedBlocksSection } from "./orphaned-blocks-section";
import { ReorgSection } from "./reorg-section";
import { ValidatorStatusSection } from "./validator-status-section";

export const NetworkHealth: FC = () => {
  useSubTitle("Network Health");

  const {
    data: reorgs,
    isLoading: reorgsLoading,
    error: reorgsError,
  } = useReorgs();

  const {
    data: validatorTotals,
    isLoading: validatorTotalsLoading,
    error: validatorTotalsError,
  } = useValidatorTotals();

  const {
    data: blocksByNativeStatus,
    isLoading: blocksByNativeStatusLoading,
    error: blocksByNativeStatusError,
  } = useBlocksByNativeStatus();

  const {
    data: latestTxEffects,
    isLoading: latestTxEffectsLoading,
    error: latestTxEffectsError,
  } = useGetLatestTxEffects();

  const averageTimeData = useMemo(() => {
    if (!latestTxEffects) {
      return undefined;
    }

    const totalTime = latestTxEffects.reduce(
      (acc, txEffect) => {
        return {
          birthTime: acc.birthTime + txEffect.txBirthTimestamp,
          blockTime: acc.blockTime + txEffect.timestamp,
        };
      },
      {
        birthTime: 0,
        blockTime: 0,
      },
    );

    const averageTxTimeS =
      ((totalTime.blockTime - totalTime.birthTime) / latestTxEffects.length) *
      1000;
    return averageTxTimeS !== undefined
      ? averageTxTimeS < 30 // NOTE: since we are polling for pending TXs we quite often get a birth timestamp after the block timestamp, therefore we get negative average time
        ? "< 30 secs"
        : `${averageTxTimeS} s`
      : "Calculating...";
  }, [latestTxEffects]);

  // Calculate reorgs in the last 48 hours
  const reorgsLast48Hours = useMemo(() => {
    return (
      reorgs?.filter((reorg) => {
        const reorgTime = new Date(reorg.timestamp);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - reorgTime.getTime()) / (1000 * 60 * 60);
        return hoursDiff <= 48;
      }).length ?? 0
    );
  }, [reorgs]);

  const { validatorsTitle, validatorsData } = useMemo(() => {
    let title = "Number of Validators";
    let data = "0";

    if (validatorTotals) {
      const totalValidators = validatorTotals.total;
      const validatingValidatorsPercentage =
        totalValidators > 0
          ? Math.round((validatorTotals.validating / totalValidators) * 100)
          : 0;

      title = `Number of Validators (${validatingValidatorsPercentage}%)`;
      data = `${totalValidators}`;
    }

    return { validatorsTitle: title, validatorsData: data };
  }, [validatorTotals]);

  const blocksByNativeStatusData = useMemo(() => {
    if (!blocksByNativeStatus) {
      return "A lot";
    }

    let highestBlockHeight = 0n;
    let lowestBlockHeight = 0n;

    for (const block of blocksByNativeStatus) {
      if (block.height > highestBlockHeight) {
        highestBlockHeight = block.height;
      }
      if (block.height < lowestBlockHeight || lowestBlockHeight === 0n) {
        lowestBlockHeight = block.height;
      }
    }

    return (highestBlockHeight - lowestBlockHeight).toString();
  }, [blocksByNativeStatus]);

  return (
    <BaseLayout>
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">Network Health</h1>
      </div>

      {/* InfoBadge section */}
      <div className="grid grid-cols-2 gap-3 mt-14 mb-10 md:mt-20 md:mb-10 md:grid-cols-4 md:gap-5">
        <InfoBadge
          title={`Average Tx Time (last ${latestTxEffects?.length})`}
          isLoading={latestTxEffectsLoading}
          error={latestTxEffectsError}
          data={averageTimeData}
        />
        <InfoBadge
          title={validatorsTitle}
          isLoading={validatorTotalsLoading}
          error={validatorTotalsError}
          data={validatorsData}
        />
        <InfoBadge
          title="Reorgs (Last 48h)"
          isLoading={reorgsLoading}
          error={reorgsError}
          data={reorgsLast48Hours.toString()}
        />
        <InfoBadge
          title="Unproven Blocks"
          isLoading={blocksByNativeStatusLoading}
          error={blocksByNativeStatusError}
          data={blocksByNativeStatusData}
        />
      </div>

      <BlockProductionSection />
      <ValidatorStatusSection />
      <NativeStatusSection />
      <ReorgSection />
      <OrphanedBlocksSection />
    </BaseLayout>
  );
};
