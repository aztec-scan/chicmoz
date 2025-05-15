import {
  uiTxEffectTableSchema,
  type ChicmozL2Block,
  type ChicmozL2BlockLight,
  type UiTxEffectTable,
} from "@chicmoz-pkg/types";
import { type DetailItem } from "~/components/info-display/key-value-display";
import { formatTimeSince } from "~/lib/utils";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getBlockDetails = (
  latestBlock: ChicmozL2BlockLight,
): DetailItem[] => {
  const l2BlockTimestamp = latestBlock.header.globalVariables.timestamp;
  const l2BlockTimeSince = formatTimeSince(l2BlockTimestamp);

  const proposedOnL1Date: Date | undefined | null =
    latestBlock?.proposedOnL1?.l1BlockTimestamp;
  const proposedTimeSince: string | undefined = formatTimeSince(
    proposedOnL1Date?.getTime(),
  );

  const proofVerifiedOnL1Date: Date | undefined | null =
    latestBlock?.proofVerifiedOnL1?.l1BlockTimestamp;
  const proofVerifiedTimeSince: string | undefined = formatTimeSince(
    proofVerifiedOnL1Date?.getTime(),
  );

  return [
    { label: "Block Number", value: "" + latestBlock.height },
    { label: "Block Hash", value: latestBlock.hash },
    {
      label: "Timestamp",
      value: `${new Date(
        l2BlockTimestamp,
      ).toLocaleString()} (${l2BlockTimeSince})`,
    },
    {
      label: "slotNumber",
      value: "" + latestBlock.header.globalVariables.slotNumber,
    },
    {
      label: "coinbase",
      value: "" + latestBlock.header.globalVariables.coinbase,
    },
    {
      label: "Number of Transactions",
      value: "" + latestBlock.body.txEffects.length,
    },
    {
      label: "feeRecipient",
      value: "" + latestBlock.header.globalVariables.feeRecipient,
    },
    {
      label: "totalFees (FJ)",
      value: "" + latestBlock.header.totalFees,
    },
    {
      label: "totalManaUsed",
      value: "" + latestBlock.header.totalManaUsed,
    },
    {
      label: "feePerDaGas",
      value: "" + latestBlock.header.globalVariables.gasFees.feePerDaGas,
    },
    {
      label: "feePerL2Gas",
      value: "" + latestBlock.header.globalVariables.gasFees.feePerL2Gas,
    },
    {
      label: " Block status",
      value: "" + latestBlock.finalizationStatus,
    },
    {
      label: "Proposed on L1",
      value: proposedOnL1Date
        ? `${proposedOnL1Date.toLocaleString()} (${proposedTimeSince})`
        : "Not yet proposed",
    },
    {
      label: "Proof Verified on L1",
      value: proofVerifiedOnL1Date
        ? `${proofVerifiedOnL1Date.toLocaleString()} (${proofVerifiedTimeSince})`
        : "Not yet verified",
    },
    {
      label: "Raw Data",
      value: "View raw data",
      extLink: `${API_URL}/${aztecExplorer.getL2BlockByHash}${latestBlock.height}`,
    },
  ];
};

export const getTxEffects = (
  txEffects?: ChicmozL2Block["body"]["txEffects"],
  block?: ChicmozL2BlockLight,
): UiTxEffectTable[] | undefined => {
  if (!txEffects) {
    return undefined;
  }
  if (!block) {
    return undefined;
  }
  return txEffects.map((tx) =>
    uiTxEffectTableSchema.parse({
      txHash: tx.txHash,
      transactionFee: tx.transactionFee,
      blockNumber: block.height,
      timestamp: tx.txBirthTimestamp,
    }),
  );
};
