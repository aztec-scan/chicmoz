import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { useMemo, type FC } from "react";
import { BlockCountdownProgress } from "~/components/block-countdown-progress";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { useAvarageBlockTime, useLatestTableBlocks } from "~/hooks";

interface PendingTxDetailsProps {
  pendingTxDetails: ChicmozL2PendingTx;
}
export const PendingTxDetails: FC<PendingTxDetailsProps> = ({
  pendingTxDetails,
}) => {
  const { data: avarageBlockTime } = useAvarageBlockTime();

  const { data: latestBlocks } = useLatestTableBlocks();

  const blocksCreatedSinceTx = useMemo(() => {
    if (!latestBlocks || latestBlocks.length === 0) return 0;

    const blocksAfterTx = latestBlocks.filter(
      (block) => block.timestamp > pendingTxDetails.birthTimestamp.getTime(),
    );

    return blocksAfterTx.length;
  }, [latestBlocks, pendingTxDetails.birthTimestamp]);

  const isStaleTransaction = blocksCreatedSinceTx >= 2;

  return (
    <div className="mx-auto px-7 max-w-[1440px] md:px-[70px]">
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">Transactions Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">
            Pending Transactions Details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {isStaleTransaction ? (
            <OrphanedBanner
              type="pending-tx"
              blockAmount={blocksCreatedSinceTx}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-600 dark:text-gray-300">
                This is a pending transaction it might be included in the next
                block:
              </p>
              <BlockCountdownProgress
                latestBlocks={latestBlocks}
                averageBlockTime={avarageBlockTime}
              />
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay
              data={[
                { label: "Hash", value: pendingTxDetails.txHash },
                {
                  label: "Timestamp",
                  value: pendingTxDetails.birthTimestamp.toString(),
                  timestamp: pendingTxDetails.birthTimestamp.getTime(),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
