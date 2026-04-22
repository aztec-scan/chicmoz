import { type ChicmozL2PendingTx } from "@chicmoz-pkg/types";
import { createElement, useMemo, type FC } from "react";
import { BlockCountdownProgress } from "~/components/block-countdown-progress";
import { EtherscanAddressLink } from "~/components/etherscan-address-link";
import { FeePaymentMethodBadge } from "~/components/fee-payment-method-badge";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { useAvarageBlockTime, useLatestTableBlocks } from "~/hooks";
import { useTimeTick } from "~/hooks/useTimeTick";
import { BaseLayout } from "~/layout/base-layout";

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
            link: `/contracts/instances/${pendingTxDetails.feePayer}`,
          },
        ]
      : []),
    ...(pendingTxDetails.initiator
      ? [
          {
            label: "Initiator",
            value: pendingTxDetails.initiator,
            link: `/contracts/instances/${pendingTxDetails.initiator}`,
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
              <div className="flex flex-col gap-4">
                {pendingTxDetails.publicCallRequests.map((req, i) => (
                  <div key={i} className="border-0">
                    <KeyValueDisplay
                      data={[
                        {
                          label: "Msg Sender",
                          value: req.msgSender,
                          link: `/contracts/instances/${req.msgSender}`,
                        },
                        {
                          label: "Contract Address",
                          value: req.contractAddress,
                          link: `/contracts/instances/${req.contractAddress}`,
                        },
                        { label: "Call Type", value: req.callType },
                        ...(req.functionSelector
                          ? [
                              {
                                label: "Function Selector",
                                value: req.functionSelector,
                              },
                            ]
                          : []),
                        {
                          label: "Is Static Call",
                          value: req.isStaticCall ? "Yes" : "No",
                        },
                        { label: "Calldata Hash", value: req.calldataHash },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {pendingTxDetails.l2ToL1Msgs &&
          pendingTxDetails.l2ToL1Msgs.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">L2→L1 Messages</h3>
              <div className="flex flex-col gap-4">
                {pendingTxDetails.l2ToL1Msgs.map((msg, i) => (
                  <div key={i} className="border rounded p-3">
                    <KeyValueDisplay
                      data={[
                        { label: "Index", value: msg.index.toString() },
                        {
                          label: "Contract Address",
                          value: msg.contractAddress,
                          link: `/contracts/instances/${msg.contractAddress}`,
                        },
                        {
                          label: "Recipient",
                          value: "CUSTOM",
                          customValue: createElement(EtherscanAddressLink, {
                            content: msg.recipient,
                            endpoint: `/address/${msg.recipient}`,
                          }),
                        },
                        { label: "Content", value: msg.content },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </BaseLayout>
  );
};
