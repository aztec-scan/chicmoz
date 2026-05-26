import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  type ChicmozL1L2BlockProposed,
  type ChicmozL1L2ProofVerified,
} from "@chicmoz-pkg/types";
import {
  l1L2BlockProposedTable,
  l1L2ProofVerifiedTable,
} from "../../schema/index.js";

export const addL1L2BlockProposed = async (
  proposedData: ChicmozL1L2BlockProposed,
): Promise<void> => {
  if (!proposedData.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  const l1TransactionHash: string | null =
    proposedData.l1TransactionHash === undefined ||
    proposedData.l1TransactionHash === null
      ? null
      : String(proposedData.l1TransactionHash);
  await db()
    .insert(l1L2BlockProposedTable)
    .values({
      ...proposedData,
      l1BlockTimestamp: proposedData.l1BlockTimestamp,
    })
    .onConflictDoUpdate({
      target: [
        l1L2BlockProposedTable.l2BlockNumber,
        l1L2BlockProposedTable.archive,
      ],
      set: {
        isFinalized: proposedData.isFinalized,
        l1BlockNumber: proposedData.l1BlockNumber,
        l1BlockHash: proposedData.l1BlockHash,
        l1BlockTimestamp: proposedData.l1BlockTimestamp,
        l1TransactionHash,
        l1ContractAddress: proposedData.l1ContractAddress,
      },
    });
};

export const addL1L2ProofVerified = async (
  proofVerifiedData: ChicmozL1L2ProofVerified,
): Promise<void> => {
  if (!proofVerifiedData.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  const l1TransactionHash: string | null =
    proofVerifiedData.l1TransactionHash === undefined ||
    proofVerifiedData.l1TransactionHash === null
      ? null
      : String(proofVerifiedData.l1TransactionHash);
  // TODO: db-transaction
  await db()
    .insert(l1L2ProofVerifiedTable)
    .values({
      ...proofVerifiedData,
      l1BlockTimestamp: proofVerifiedData.l1BlockTimestamp,
    })
    .onConflictDoUpdate({
      target: [
        l1L2ProofVerifiedTable.l2BlockNumber,
        l1L2ProofVerifiedTable.proverId,
      ],
      set: {
        isFinalized: proofVerifiedData.isFinalized,
        l1BlockNumber: proofVerifiedData.l1BlockNumber,
        l1BlockHash: proofVerifiedData.l1BlockHash,
        l1BlockTimestamp: proofVerifiedData.l1BlockTimestamp,
        l1TransactionHash,
        l1ContractAddress: proofVerifiedData.l1ContractAddress,
      },
    });
};
