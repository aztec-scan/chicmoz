import { eq, and, sql } from "drizzle-orm";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  l1GovernanceProposalsTable,
  l1GovernanceVotesTable,
  l1GovernanceSignalsTable,
  l1GovernancePayloadRoundsTable,
  l1GovernanceConfigurationsTable,
  l1GovernanceProposerHistoryTable,
} from "../../../schema/l1/governance.js";
import type {
  ChicmozL1GovernanceProposed,
  ChicmozL1GovernanceVoteCast,
  ChicmozL1GovernanceProposalExecuted,
  ChicmozL1GovernanceProposalDropped,
  ChicmozL1GovernanceSignalCast,
  ChicmozL1GovernancePayloadSubmittable,
  ChicmozL1GovernancePayloadSubmitted,
  ChicmozL1GovernanceConfigUpdated,
  ChicmozL1GovernanceProposerUpdated,
} from "@chicmoz-pkg/types";

export const storeGovernanceProposed = async (
  event: ChicmozL1GovernanceProposed,
  metadata: Record<string, unknown> | null,
  configuration: Record<string, unknown> | null,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  const createdAt = new Date(event.l1BlockTimestamp).getTime();

  return await db()
    .insert(l1GovernanceProposalsTable)
    .values({
      proposalId: event.proposalId.toString(),
      payloadAddress: event.proposalAddress,
      proposer: null, // Will be resolved later if needed
      governanceProposerAddress: null,
      state: "Pending",
      createdAt,
      summedYea: 0n,
      summedNay: 0n,
      configuration,
      uri: event.uri,
      metadata,
      l1BlockNumber: event.l1BlockNumber,
      l1BlockHash: event.l1BlockHash,
      l1BlockTimestamp: event.l1BlockTimestamp,
      l1TransactionHash: event.l1TransactionHash ?? null,
      isFinalized: event.isFinalized,
    })
    .onConflictDoNothing({
      target: [l1GovernanceProposalsTable.proposalId],
    });
};

export const storeGovernanceVoteCast = async (
  event: ChicmozL1GovernanceVoteCast,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  // Insert vote
  await db()
    .insert(l1GovernanceVotesTable)
    .values({
      proposalId: event.proposalId.toString(),
      voter: event.voter,
      support: event.support,
      amount: event.amount,
      l1BlockNumber: event.l1BlockNumber,
      l1BlockHash: event.l1BlockHash,
      l1BlockTimestamp: event.l1BlockTimestamp,
      l1TransactionHash: event.l1TransactionHash ?? "",
      l1LogIndex: event.l1LogIndex ?? 0,
      isFinalized: event.isFinalized,
    })
    .onConflictDoNothing({
      target: [
        l1GovernanceVotesTable.l1TransactionHash,
        l1GovernanceVotesTable.l1LogIndex,
        l1GovernanceVotesTable.isFinalized,
      ],
    });

  // Update proposal summed votes using SQL expression for bigint arithmetic
  const proposalIdStr = event.proposalId.toString();
  if (event.support) {
    await db()
      .update(l1GovernanceProposalsTable)
      .set({
        summedYea: sql`${l1GovernanceProposalsTable.summedYea} + ${event.amount}`,
      })
      .where(
        eq(l1GovernanceProposalsTable.proposalId, proposalIdStr),
      );
  } else {
    await db()
      .update(l1GovernanceProposalsTable)
      .set({
        summedNay: sql`${l1GovernanceProposalsTable.summedNay} + ${event.amount}`,
      })
      .where(
        eq(l1GovernanceProposalsTable.proposalId, proposalIdStr),
      );
  }
};

export const storeGovernanceProposalExecuted = async (
  event: ChicmozL1GovernanceProposalExecuted,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  await db()
    .update(l1GovernanceProposalsTable)
    .set({
      state: "Executed",
      executedAt: new Date(event.l1BlockTimestamp).getTime(),
    })
    .where(
      eq(
        l1GovernanceProposalsTable.proposalId,
        event.proposalId.toString(),
      ),
    );
};

export const storeGovernanceProposalDropped = async (
  event: ChicmozL1GovernanceProposalDropped,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  await db()
    .update(l1GovernanceProposalsTable)
    .set({
      state: "Dropped",
      droppedAt: new Date(event.l1BlockTimestamp).getTime(),
    })
    .where(
      eq(
        l1GovernanceProposalsTable.proposalId,
        event.proposalId.toString(),
      ),
    );
};

export const storeGovernanceSignalCast = async (
  event: ChicmozL1GovernanceSignalCast,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  // Insert signal
  await db()
    .insert(l1GovernanceSignalsTable)
    .values({
      payloadAddress: event.payloadAddress,
      round: event.round,
      signaler: event.signaler,
      l1BlockNumber: event.l1BlockNumber,
      l1BlockHash: event.l1BlockHash,
      l1BlockTimestamp: event.l1BlockTimestamp,
      l1TransactionHash: event.l1TransactionHash ?? "",
      l1LogIndex: event.l1LogIndex ?? 0,
      isFinalized: event.isFinalized,
    })
    .onConflictDoNothing({
      target: [
        l1GovernanceSignalsTable.l1TransactionHash,
        l1GovernanceSignalsTable.l1LogIndex,
        l1GovernanceSignalsTable.isFinalized,
      ],
    });

  // Upsert payload round with increment
  await db()
    .insert(l1GovernancePayloadRoundsTable)
    .values({
      payloadAddress: event.payloadAddress,
      round: event.round,
      signalCount: 1n,
    })
    .onConflictDoUpdate({
      target: [
        l1GovernancePayloadRoundsTable.payloadAddress,
        l1GovernancePayloadRoundsTable.round,
      ],
      set: {
        signalCount: sql`${l1GovernancePayloadRoundsTable.signalCount} + 1`,
      },
    });
};

export const storeGovernancePayloadSubmittable = async (
  event: ChicmozL1GovernancePayloadSubmittable,
) => {
  await db()
    .update(l1GovernancePayloadRoundsTable)
    .set({ isSubmittable: true })
    .where(
      and(
        eq(
          l1GovernancePayloadRoundsTable.payloadAddress,
          event.payloadAddress,
        ),
        eq(l1GovernancePayloadRoundsTable.round, event.round),
      ),
    );
};

export const storeGovernancePayloadSubmitted = async (
  event: ChicmozL1GovernancePayloadSubmitted,
) => {
  await db()
    .update(l1GovernancePayloadRoundsTable)
    .set({ isSubmitted: true, winningPayload: true })
    .where(
      and(
        eq(
          l1GovernancePayloadRoundsTable.payloadAddress,
          event.payloadAddress,
        ),
        eq(l1GovernancePayloadRoundsTable.round, event.round),
      ),
    );
};

export const storeGovernanceConfigUpdated = async (
  event: ChicmozL1GovernanceConfigUpdated,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  await db().insert(l1GovernanceConfigurationsTable).values({
    configuration: event.configuration,
    updatedAt: new Date(event.l1BlockTimestamp).getTime(),
    l1BlockNumber: event.l1BlockNumber,
    l1BlockHash: event.l1BlockHash,
    l1BlockTimestamp: event.l1BlockTimestamp,
  });
};

export const storeGovernanceProposerUpdated = async (
  event: ChicmozL1GovernanceProposerUpdated,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  await db().insert(l1GovernanceProposerHistoryTable).values({
    governanceProposerAddress: event.governanceProposerAddress,
    updatedAt: new Date(event.l1BlockTimestamp).getTime(),
    l1BlockNumber: event.l1BlockNumber,
    l1BlockHash: event.l1BlockHash,
    l1BlockTimestamp: event.l1BlockTimestamp,
  });
};
