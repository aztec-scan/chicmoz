import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { DroppedBanner } from "~/components/dropped-banner";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { LoadingDetails } from "~/components/loading/loading-details";
import { getEmptyTxEffectData } from "~/components/loading/util";
import { OrphanedBanner } from "~/components/orphaned-banner";
import {
  useGetDroppedTxByHash,
  useGetTxEffectByHash,
  usePendingTxsByHash,
  useSubTitle,
} from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";
import { TabsSection } from "./tabs-section";
import { getDroppedTxEffectData, getTxEffectData } from "./utils";
import { PendingTxDetails } from "./pending-tx-details";

export const TxEffectDetails: FC = () => {
  const { hash } = useParams({
    from: "/tx-effects/$hash",
  });
  useSubTitle(`TxEff ${hash}`);
  const {
    data: txEffects,
    isLoading: isTxEffectsLoading,
    error: txEffectsError,
  } = useGetTxEffectByHash(hash);

  const { data: pendingTx, isLoading: isPendingTxLoading } =
    usePendingTxsByHash(hash);

  const { data: droppedTx, isLoading: isDroppedTxLoading } =
    useGetDroppedTxByHash(hash);

  if (!hash) {
    return <LoadingDetails title="No transaction hash found" />;
  }

  if (isTxEffectsLoading && isPendingTxLoading && isDroppedTxLoading) {
    return (
      <LoadingDetails
        title="Transaction Details"
        emptyData={getEmptyTxEffectData()}
      />
    );
  }

  if (txEffectsError && !pendingTx && !droppedTx) {
    return <div>Error loading transaction details</div>;
  }

  // Dropped transaction - display dropped banner with details
  if (droppedTx) {
    return (
      <BaseLayout>
        <div>
          <div className="flex flex-wrap m-3">
            <h3 className="text-primary md:hidden">Tx Details</h3>
            <h2 className="hidden md:block md:mt-8 md:text-primary">
              Tx Details
            </h2>
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <DroppedBanner />
            <div className="bg-white rounded-lg shadow-md p-4">
              <KeyValueDisplay data={getDroppedTxEffectData(droppedTx)} />
            </div>
          </div>
        </div>
      </BaseLayout>
    );
  }

  // Pending TX exists but no tx effects yet
  if (pendingTx && !txEffects) {
    return <PendingTxDetails pendingTxDetails={pendingTx} />;
  }

  // No data found
  // TODO: Make proper error page when no transaction is found
  if (!txEffects) {
    return (
      <LoadingDetails
        title="No transaction found."
        description="Perhaps it has just not reached our indexer yet,
        that might take a couple of seconds."
      />
    );
  }

  // Success state - data is available
  return (
    <BaseLayout>
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">Transactions Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">
            Transactions Details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {"isOrphaned" in txEffects && txEffects.isOrphaned ? (
            <OrphanedBanner type="tx-effect" />
          ) : null}
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay data={getTxEffectData(txEffects)} />
          </div>
          <TabsSection txEffects={txEffects} />
        </div>
      </div>
    </BaseLayout>
  );
};
