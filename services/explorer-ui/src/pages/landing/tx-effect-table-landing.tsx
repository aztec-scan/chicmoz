import { type UiTxEffectTable } from "@chicmoz-pkg/types";
import { useEffect, useMemo, useState, type FC } from "react";
import { getTableTxEffectObj } from "~/components/tx-effects/tx-effects-schema";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import { useLatestTableTxEffects, usePendingTxs } from "~/hooks";

export const TxEffectTableLanding: FC = () => {
  const [showPendingTxs, setShowPendingTxs] = useState(true);
  const [pendingTxCount, setPendingTxCount] = useState<number | undefined>(
    undefined,
  );
  const { data: pendingTxs } = usePendingTxs();
  const {
    data: latestTxEffectsData,
    isLoading: isLoadingTxEffects,
    error: txEffectsError,
  } = useLatestTableTxEffects();

  useEffect(() => {
    if (pendingTxs?.length !== pendingTxCount) {
      setPendingTxCount(pendingTxs?.length);
    }
  }, [pendingTxs?.length, pendingTxCount]);

  const toggleShowPendingTx = () => {
    setShowPendingTxs(!showPendingTxs);
  };

  const txEffectData = useMemo(() => {
    if (!showPendingTxs || !pendingTxs || !latestTxEffectsData) {
      return latestTxEffectsData;
    }

    const pendingTxEffects = pendingTxs.reduce((acc, tx) => {
      if (!latestTxEffectsData.some((effect) => effect.txHash === tx.hash)) {
        acc.push({
          txHash: tx.hash,
          transactionFee: -1,
          blockNumber: -1n,
          timestamp: tx.birthTimestamp ?? 0,
        });
      }
      return acc;
    }, [] as UiTxEffectTable[]);

    return [...pendingTxEffects, ...latestTxEffectsData];
  }, [latestTxEffectsData, pendingTxs, showPendingTxs]);

  return (
    <TxEffectsTable
      txEffects={getTableTxEffectObj(txEffectData)}
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
