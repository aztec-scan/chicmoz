import { eq, desc, and } from "drizzle-orm";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import type { ProposalState } from "@chicmoz-pkg/types";
import {
  l1GovernanceProposalsTable,
  l1GovernanceVotesTable,
  l1GovernanceSignalsTable,
  l1GovernancePayloadRoundsTable,
  l1GovernanceConfigurationsTable,
  l1GovernanceProposerHistoryTable,
} from "../../../schema/l1/governance.js";

// ── Proposals ────────────────────────────────────────────────────────────────

export const getProposals = async (params?: {
  state?: ProposalState;
  from?: number;
  to?: number;
  offset?: number;
  limit?: number;
}) => {
  const { state, offset = 0, limit = 20 } = params ?? {};

  const conditions = [];
  if (state) {
    conditions.push(eq(l1GovernanceProposalsTable.state, state));
  }

  return await db()
    .select()
    .from(l1GovernanceProposalsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(l1GovernanceProposalsTable.createdAt))
    .limit(limit)
    .offset(offset);
};

export const getProposalById = async (proposalId: string) => {
  const results = await db()
    .select()
    .from(l1GovernanceProposalsTable)
    .where(eq(l1GovernanceProposalsTable.proposalId, proposalId))
    .limit(1);

  return results[0] ?? null;
};

export const getProposalVotes = async (
  proposalId: string,
  params?: {
    support?: boolean;
    offset?: number;
    limit?: number;
  },
) => {
  const { support, offset = 0, limit = 50 } = params ?? {};

  const conditions = [eq(l1GovernanceVotesTable.proposalId, proposalId)];
  if (support !== undefined) {
    conditions.push(eq(l1GovernanceVotesTable.support, support));
  }

  return await db()
    .select()
    .from(l1GovernanceVotesTable)
    .where(and(...conditions))
    .orderBy(desc(l1GovernanceVotesTable.l1BlockNumber))
    .limit(limit)
    .offset(offset);
};

export const getProposalSignals = async (
  payloadAddress: string,
  params?: {
    offset?: number;
    limit?: number;
  },
) => {
  const { offset = 0, limit = 50 } = params ?? {};

  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(eq(l1GovernanceSignalsTable.payloadAddress, payloadAddress))
    .orderBy(desc(l1GovernanceSignalsTable.l1BlockNumber))
    .limit(limit)
    .offset(offset);
};

// ── Signals ──────────────────────────────────────────────────────────────────

export const getSignals = async (params?: {
  payloadAddress?: string;
  round?: bigint;
  signaler?: string;
  offset?: number;
  limit?: number;
}) => {
  const { payloadAddress, round, signaler, offset = 0, limit = 50 } =
    params ?? {};

  const conditions = [];
  if (payloadAddress) {
    conditions.push(
      eq(l1GovernanceSignalsTable.payloadAddress, payloadAddress),
    );
  }
  if (round !== undefined) {
    conditions.push(eq(l1GovernanceSignalsTable.round, round));
  }
  if (signaler) {
    conditions.push(eq(l1GovernanceSignalsTable.signaler, signaler));
  }

  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(l1GovernanceSignalsTable.l1BlockNumber))
    .limit(limit)
    .offset(offset);
};

export const getSignalsByRound = async (round: bigint) => {
  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(eq(l1GovernanceSignalsTable.round, round))
    .orderBy(desc(l1GovernanceSignalsTable.l1BlockNumber));
};

export const getSignalsByPayload = async (payloadAddress: string) => {
  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(eq(l1GovernanceSignalsTable.payloadAddress, payloadAddress))
    .orderBy(desc(l1GovernanceSignalsTable.l1BlockNumber));
};

// ── Payload Rounds ───────────────────────────────────────────────────────────

export const getPayloadRounds = async () => {
  return await db()
    .select()
    .from(l1GovernancePayloadRoundsTable)
    .orderBy(
      desc(l1GovernancePayloadRoundsTable.round),
      desc(l1GovernancePayloadRoundsTable.signalCount),
    );
};

export const getPayloadRound = async (
  payloadAddress: string,
  round: bigint,
) => {
  const results = await db()
    .select()
    .from(l1GovernancePayloadRoundsTable)
    .where(
      and(
        eq(l1GovernancePayloadRoundsTable.payloadAddress, payloadAddress),
        eq(l1GovernancePayloadRoundsTable.round, round),
      ),
    )
    .limit(1);

  return results[0] ?? null;
};

// ── Configurations ───────────────────────────────────────────────────────────

export const getConfigurations = async (params?: {
  offset?: number;
  limit?: number;
}) => {
  const { offset = 0, limit = 20 } = params ?? {};

  return await db()
    .select()
    .from(l1GovernanceConfigurationsTable)
    .orderBy(desc(l1GovernanceConfigurationsTable.updatedAt))
    .limit(limit)
    .offset(offset);
};

// ── Proposer History ─────────────────────────────────────────────────────────

export const getProposerHistory = async (params?: {
  offset?: number;
  limit?: number;
}) => {
  const { offset = 0, limit = 20 } = params ?? {};

  return await db()
    .select()
    .from(l1GovernanceProposerHistoryTable)
    .orderBy(desc(l1GovernanceProposerHistoryTable.updatedAt))
    .limit(limit)
    .offset(offset);
};
