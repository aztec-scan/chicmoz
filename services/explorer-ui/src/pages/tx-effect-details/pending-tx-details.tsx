import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { createElement, useMemo, type FC } from "react";
import { BlockCountdownProgress } from "~/components/block-countdown-progress";
import { DataTable } from "~/components/data-table";
import { FeePaymentMethodBadge } from "~/components/fee-payment-method-badge";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { PublicCallRequestsColumns } from "~/components/public-call-requests/public-call-requests-columns";
import { useAvarageBlockTime, useLatestTableBlocks } from "~/hooks";
import { useTimeTick } from "~/hooks/useTimeTick";
import { BaseLayout } from "~/layout/base-layout";
import { L2ToL1MsgsColumnsWithoutTxHash } from "~/components/l2-to-l1-msgs/l2-to-l1-msgs-columns";

interface PendingTxDetailsProps {
  pendingTxDetails: ChicmozL2PendingTx;
}
export const PendingTxDetails: FC<PendingTxDetailsProps> = ({
  pendingTxDetails,
}) => {
  const { data: avarageBlockTime } = useAvarageBlockTime();

  const tick = useTimeTick();
  const { data: latestBlocks } = useLatestTableBlocks();

  const blocksCreatedSinceTx = useMemo(() => {
    if (!latestBlocks || latestBlocks.length === 0) {
      return 0;
    }

    const blocksAfterTx = latestBlocks.filter(
      (block) => block.timestamp > pendingTxDetails.birthTimestamp,
    );

    return blocksAfterTx.length;
  }, [latestBlocks, pendingTxDetails.birthTimestamp]);

  const isStaleTransaction = blocksCreatedSinceTx >= 2;

  const mainData = [
    { label: "Hash", value: pendingTxDetails.txHash },
    {
      label: "Timestamp",
      value: pendingTxDetails.birthTimestamp.toString(),
      timestamp: pendingTxDetails.birthTimestamp,
    },
    ...(pendingTxDetails.feePayer
      ? [
          {
            label: "Fee Payer",
            value: pendingTxDetails.feePayer,
            link: `/address/${pendingTxDetails.feePayer}`,
          },
        ]
      : []),
    ...(pendingTxDetails.initiator
      ? [
          {
            label: "Initiator",
            value: pendingTxDetails.initiator,
            link: `/address/${pendingTxDetails.initiator}`,
          },
        ]
      : []),
    ...(pendingTxDetails.feePaymentMethod
      ? [
          {
            label: "Fee Payment Method",
            value: "CUSTOM",
            customValue: createElement(FeePaymentMethodBadge, {
              method: pendingTxDetails.feePaymentMethod,
            }),
          },
        ]
      : []),
  ];

  return (
    <BaseLayout>
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
                averageBlockTimeMs={avarageBlockTime!}
              />
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay key={tick} data={mainData} />
          </div>

          {pendingTxDetails.publicCallRequests &&
          pendingTxDetails.publicCallRequests.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">
                Public Call Requests
              </h3>
              <DataTable
                columns={PublicCallRequestsColumns}
                data={pendingTxDetails.publicCallRequests}
                disableSizeSelector={false}
                maxEntries={20}
              />
            </div>
          ) : null}

          {pendingTxDetails.l2ToL1Msgs &&
          pendingTxDetails.l2ToL1Msgs.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">L2→L1 Messages</h3>
              <DataTable
                columns={L2ToL1MsgsColumnsWithoutTxHash}
                data={pendingTxDetails.l2ToL1Msgs}
                disableSizeSelector={false}
                maxEntries={20}
              />
            </div>
          ) : null}
        </div>
      </div>
    </BaseLayout>
  );
};
