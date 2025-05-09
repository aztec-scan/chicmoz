import { type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { useEffect, useMemo, useState, type FC } from "react";
import { type TxEffectTableSchema } from "~/components/tx-effects/tx-effects-schema";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import { useGetLatestTxEffects, usePendingTxs } from "~/hooks";
import { mapLatestTxEffects } from "~/lib/map-for-table";

interface TxEffectTableLandingProps {
  latestBlocks?: ChicmozL2BlockLight[];
}

export const TxEffectTableLanding: FC<TxEffectTableLandingProps> = ({
  latestBlocks,
}) => {
  const [showPendingTxs, setShowPendingTxs] = useState(true);
  const [pendingTxCount, setPendingTxCount] = useState<number | undefined>(
    undefined,
  );
  const { data: pendingTxs } = usePendingTxs();
  const {
    data: latestTxEffectsData,
    isLoading: isLoadingTxEffects,
    error: txEffectsError,
  } = useGetLatestTxEffects();

  useEffect(() => {
    if (pendingTxs?.length !== pendingTxCount) {
      setPendingTxCount(pendingTxs?.length);
    }
  }, [pendingTxs?.length, pendingTxCount]);

  const toggleShowPendingTx = () => {
    setShowPendingTxs(!showPendingTxs);
  };

  const txEffectData = useMemo(() => {
    const mappedLatestTxEffects =
      !latestTxEffectsData || !latestBlocks
        ? []
        : mapLatestTxEffects(latestTxEffectsData, latestBlocks);

    if (!showPendingTxs || !pendingTxs || !latestTxEffectsData) {
      return mappedLatestTxEffects;
    }

    const pendingTxEffects = pendingTxs.reduce((acc, tx) => {
      if (!latestTxEffectsData.some((effect) => effect.txHash === tx.hash)) {
        acc.push({
          txHash: tx.hash,
          transactionFee: -1,
          blockNumber: -1,
          timestamp: tx.birthTimestamp ?? 0,
        });
      }
      return acc;
    }, [] as TxEffectTableSchema[]);

    return [...pendingTxEffects, ...mappedLatestTxEffects];
  }, [latestTxEffectsData, latestBlocks, pendingTxs, showPendingTxs]);

  return (
    <TxEffectsTable
      txEffects={txEffectData}
      isLoading={isLoadingTxEffects}
      title="Latest Tx Effects"
      error={txEffectsError}
      disableSizeSelector={true}
      showPending={showPendingTxs}
      handleTogglePendingTx={toggleShowPendingTx}
      nbrOfPendingTxs={pendingTxCount}
    />
  );
};
