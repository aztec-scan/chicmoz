import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import {
  useGetTxEffectByHash,
  usePendingTxsByHash,
  useSubTitle,
} from "~/hooks";
import { getTxEffectData } from "./utils";
import { TabsSection } from "./tabs-section";
import { LoadingDetails } from "~/components/loading/tx-effect";
import { getEmptyTxEffectData } from "~/components/loading/util";

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

  if (!hash) {
    return <div>No txEffect hash</div>;
  }

  if (isTxEffectsLoading && isPendingTxLoading) {
    return (
      <LoadingDetails
        title="Tx Effects Details"
        emptyData={getEmptyTxEffectData()}
      />
    );
  }

  if (txEffectsError) {
    return <div>Error loading transaction details</div>;
  }

  // Pending TX exists but no tx effects yet
  if (pendingTx && !txEffects) {
    return (
      <LoadingDetails
        title="Pending Transaction"
        emptyData={getEmptyTxEffectData(
          pendingTx.hash,
          pendingTx.birthTimestamp,
        )}
      />
    );
  }

  // No data found
  // TODO: Make proper error page when no transaction is found
  if (!txEffects) {
    return <div>No Tx effect found</div>;
  }

  // Success state - data is available
  return (
    <div className="mx-auto px-7 max-w-[1440px] md:px-[70px]">
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">Tx Effects Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">
            Tx Effects Details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay data={getTxEffectData(txEffects)} />
          </div>
          <TabsSection txEffects={txEffects} />
        </div>
      </div>
    </div>
  );
};
