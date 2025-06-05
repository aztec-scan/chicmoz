import {
  uiTxEffectTableSchema,
  type ChicmozL2Block,
  type ChicmozL2BlockLight,
  type UiTxEffectTable,
} from "@chicmoz-pkg/types";
import { type DetailItem } from "~/components/info-display/key-value-display";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getBlockDetails = (
  latestBlock: ChicmozL2BlockLight,
): DetailItem[] => {
  const l2BlockTimestamp = latestBlock.header.globalVariables.timestamp;

  const proposedOnL1Date: Date | undefined | null =
    latestBlock?.proposedOnL1?.l1BlockTimestamp;

  const proofVerifiedOnL1Date: Date | undefined | null =
    latestBlock?.proofVerifiedOnL1?.l1BlockTimestamp;

  return [
    { label: "Block Number", value: "" + latestBlock.height },
    { label: "Block Hash", value: latestBlock.hash },
    {
      label: "Timestamp",
      value: l2BlockTimestamp.toString(),
      timestamp: l2BlockTimestamp,
    },
    {
      label: "slotNumber",
      value: "" + latestBlock.header.globalVariables.slotNumber,
    },
    {
      label: "coinbase",
      value: "" + latestBlock.header.globalVariables.coinbase,
      tooltip: "L1 address that receives the block reward for this block.",
    },
    {
      label: "Number of Transactions",
      value: "" + latestBlock.body.txEffects.length,
    },
    {
      label: "feeRecipient",
      value: "" + latestBlock.header.globalVariables.feeRecipient,
      tooltip: "L2 address that receives the transaction fees for this block.",
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
      tooltip:
        "FJ paid for the data usage by the transaction, e.g. creating/spending notes, emitting logs, etc.",
    },
    {
      label: "feePerL2Gas",
      value: "" + latestBlock.header.globalVariables.gasFees.feePerL2Gas,
      tooltip: "FJ paid for the computation usage of the public VM.",
    },
    {
      label: " Block status",
      value: "" + latestBlock.finalizationStatus,
    },
    {
      label: "Proposed on L1",
      value: "Not yet proposed",
      timestamp: proposedOnL1Date?.getTime() ?? undefined,
    },
    {
      label: "Proof Verified on L1",
      value: "Not yet verified",
      timestamp: proofVerifiedOnL1Date?.getTime() ?? undefined,
    },
    {
      label: "Raw Data",
      value: "View raw data",
      extLink: `${API_URL}${aztecExplorer.getL2BlockByHash}${latestBlock.height}`,
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
