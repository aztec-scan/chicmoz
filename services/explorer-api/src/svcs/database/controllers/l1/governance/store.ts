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

const toNumericString = (value: bigint | string | number | null | undefined) =>
  value === null || value === undefined ? null : value.toString();

const toTimestamp = (value: number | null | undefined) =>
  value === null || value === undefined ? null : new Date(value).getTime();

const serializeConfiguration = (configuration: Record<string, unknown> | null) => {
  if (!configuration) {
    return null;
  }
  return Object.fromEntries(
    Object.entries(configuration).map(([key, value]) => [
      key,
      typeof value === "bigint" ? value.toString() : value,
    ]),
  );
};

const requireL1LogPosition = (
  event: Pick<
    ChicmozL1GovernanceVoteCast,
    "l1TransactionHash" | "l1LogIndex" | "proposalId"
  >,
) => {
  if (event.l1TransactionHash === undefined || event.l1TransactionHash === null) {
    throw new Error(`Missing l1TransactionHash for vote ${event.proposalId}`);
  }
  if (event.l1LogIndex === undefined || event.l1LogIndex === null) {
    throw new Error(`Missing l1LogIndex for vote ${event.proposalId}`);
  }
  return {
    l1TransactionHash: event.l1TransactionHash,
    l1LogIndex: event.l1LogIndex,
  };
};

export const storeGovernanceProposed = async (
  event: ChicmozL1GovernanceProposed,
  metadata: Record<string, unknown> | null,
  configuration: Record<string, unknown> | null,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  const createdAt = new Date(event.l1BlockTimestamp).getTime();
  const proposalConfiguration = serializeConfiguration(
    (event.configuration as Record<string, unknown> | null | undefined) ?? configuration,
  );

  return await db()
    .insert(l1GovernanceProposalsTable)
    .values({
      proposalId: event.proposalId.toString(),
      payloadAddress: event.proposalAddress,
      proposer: event.proposer ?? null,
      governanceProposerAddress: event.governanceProposerAddress ?? null,
      state: event.state ?? "Pending",
      cachedState: event.cachedState ?? "Pending",
      createdAt,
      pendingThrough: toTimestamp(event.pendingThrough),
      activeThrough: toTimestamp(event.activeThrough),
      queuedThrough: toTimestamp(event.queuedThrough),
      executableThrough: toTimestamp(event.executableThrough),
      summedYea: toNumericString(event.summedYea ?? 0n) ?? "0",
      summedNay: toNumericString(event.summedNay ?? 0n) ?? "0",
      snapshotTotalPower: toNumericString(event.snapshotTotalPower),
      votesNeeded: toNumericString(event.votesNeeded),
      configuration: proposalConfiguration,
      uri: event.uri,
      metadata,
      l1BlockNumber: event.l1BlockNumber,
      l1BlockHash: event.l1BlockHash,
      l1BlockTimestamp: event.l1BlockTimestamp,
      l1TransactionHash: event.l1TransactionHash ?? null,
      isFinalized: event.isFinalized,
    })
    .onConflictDoUpdate({
      target: [l1GovernanceProposalsTable.proposalId],
      set: {
        payloadAddress: event.proposalAddress,
        proposer: event.proposer ?? null,
        governanceProposerAddress: event.governanceProposerAddress ?? null,
        state: event.state ?? "Pending",
        cachedState: event.cachedState ?? "Pending",
        pendingThrough: toTimestamp(event.pendingThrough),
        activeThrough: toTimestamp(event.activeThrough),
        queuedThrough: toTimestamp(event.queuedThrough),
        executableThrough: toTimestamp(event.executableThrough),
        summedYea: toNumericString(event.summedYea ?? 0n) ?? "0",
        summedNay: toNumericString(event.summedNay ?? 0n) ?? "0",
        snapshotTotalPower: toNumericString(event.snapshotTotalPower),
        votesNeeded: toNumericString(event.votesNeeded),
        configuration:
          proposalConfiguration ?? sql`${l1GovernanceProposalsTable.configuration}`,
        uri: event.uri ?? sql`${l1GovernanceProposalsTable.uri}`,
        metadata: metadata ?? sql`${l1GovernanceProposalsTable.metadata}`,
        l1BlockNumber: event.l1BlockNumber,
        l1BlockHash: event.l1BlockHash,
        l1BlockTimestamp: event.l1BlockTimestamp,
        l1TransactionHash: event.l1TransactionHash ?? null,
        isFinalized: event.isFinalized,
      },
    });
};

export const updateGovernanceProposalUri = async ({
  proposalId,
  uri,
  metadata,
}: {
  proposalId: string;
  uri: string;
  metadata: Record<string, unknown> | null;
}) => {
  return await db()
    .update(l1GovernanceProposalsTable)
    .set({ uri, metadata })
    .where(eq(l1GovernanceProposalsTable.proposalId, proposalId));
};

export const storeGovernanceVoteCast = async (
  event: ChicmozL1GovernanceVoteCast,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  const { l1TransactionHash, l1LogIndex } = requireL1LogPosition(event);

  // Insert vote
  await db()
    .insert(l1GovernanceVotesTable)
    .values({
      proposalId: event.proposalId.toString(),
      voter: event.voter,
      support: event.support,
      amount: event.amount.toString(),
      l1BlockNumber: event.l1BlockNumber,
      l1BlockHash: event.l1BlockHash,
      l1BlockTimestamp: event.l1BlockTimestamp,
      l1TransactionHash,
      l1LogIndex,
      isFinalized: event.isFinalized,
    })
    .onConflictDoNothing({
      target: [
        l1GovernanceVotesTable.l1TransactionHash,
        l1GovernanceVotesTable.l1LogIndex,
        l1GovernanceVotesTable.isFinalized,
      ],
    });

  // Prefer the post-vote on-chain proposal snapshot over event-derived addition.
  // This keeps the DB correct across duplicate finalized/non-finalized logs and
  // avoids relying on PostgreSQL bigint, which cannot store Aztec governance power.
  const proposalIdStr = event.proposalId.toString();
  if (event.summedYea !== undefined && event.summedNay !== undefined) {
    await db()
      .update(l1GovernanceProposalsTable)
      .set({
        state: event.state ?? "Active",
        cachedState: event.cachedState ?? "Pending",
        summedYea: event.summedYea.toString(),
        summedNay: event.summedNay.toString(),
        snapshotTotalPower: toNumericString(event.snapshotTotalPower),
        votesNeeded: toNumericString(event.votesNeeded),
      })
      .where(
        eq(l1GovernanceProposalsTable.proposalId, proposalIdStr),
      );
  } else if (event.support) {
    await db()
      .update(l1GovernanceProposalsTable)
      .set({
        summedYea: sql`${l1GovernanceProposalsTable.summedYea} + ${event.amount.toString()}`,
      })
      .where(eq(l1GovernanceProposalsTable.proposalId, proposalIdStr));
  } else {
    await db()
      .update(l1GovernanceProposalsTable)
      .set({
        summedNay: sql`${l1GovernanceProposalsTable.summedNay} + ${event.amount.toString()}`,
      })
      .where(eq(l1GovernanceProposalsTable.proposalId, proposalIdStr));
  }
};

export const storeGovernanceProposalExecuted = async (
  event: ChicmozL1GovernanceProposalExecuted,
) => {
  if (!event.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }

  const proposalSnapshotUpdate =
    event.summedYea !== undefined && event.summedNay !== undefined
      ? {
          summedYea: event.summedYea.toString(),
          summedNay: event.summedNay.toString(),
          snapshotTotalPower: toNumericString(event.snapshotTotalPower),
          votesNeeded: toNumericString(event.votesNeeded),
        }
      : {};

  await db()
    .update(l1GovernanceProposalsTable)
    .set({
      state: "Executed",
      cachedState: event.cachedState ?? "Executed",
      ...proposalSnapshotUpdate,
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

  const proposalSnapshotUpdate =
    event.summedYea !== undefined && event.summedNay !== undefined
      ? {
          summedYea: event.summedYea.toString(),
          summedNay: event.summedNay.toString(),
          snapshotTotalPower: toNumericString(event.snapshotTotalPower),
          votesNeeded: toNumericString(event.votesNeeded),
        }
      : {};

  await db()
    .update(l1GovernanceProposalsTable)
    .set({
      state: "Dropped",
      cachedState: event.cachedState ?? "Dropped",
      ...proposalSnapshotUpdate,
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
