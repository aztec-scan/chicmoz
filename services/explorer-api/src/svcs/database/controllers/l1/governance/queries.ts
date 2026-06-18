import {
  eq,
  desc,
  and,
  asc,
  gte,
  isNull,
  or,
  getTableColumns,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import type { ProposalState } from "@chicmoz-pkg/types";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import {
  l1GovernanceProposalsTable,
  l1GovernanceVotesTable,
  l1GovernanceSignalsTable,
  l1GovernancePayloadRoundsTable,
  l1GovernanceConfigurationsTable,
  l1GovernanceProposerHistoryTable,
} from "../../../schema/l1/governance.js";
import { l1GenericContractEventTable } from "../../../schema/l1/generic-contract-event.js";
import { getL2ChainInfo } from "../../l2/index.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten metadata JSONB into top-level fields expected by the API schema / UI. */
const flattenProposalMetadata = <T extends { metadata: unknown }>(row: T): T & {
  title: string | null;
  forum_link: string | null;
  github_pr: unknown;
  votesCast: bigint;
} => {
  const meta = (row.metadata as Record<string, unknown> | null) ?? {};
  const voteRow = row as T & { summedYea: bigint | string; summedNay: bigint | string };
  return {
    ...row,
    title: (meta?.title as string | undefined) ?? null,
    forum_link: (meta?.forum_link as string | undefined) ?? null,
    github_pr: (meta?.github_pr as Record<string, unknown> | null) ?? null,
    votesCast: BigInt(voteRow.summedYea) + BigInt(voteRow.summedNay),
  };
};

type CurrentGovernanceAddresses = {
  governanceAddress: string;
  governanceProposerAddress: string;
  currentL1ContractAddresses: string[];
};

const getCurrentGovernanceAddresses = async (): Promise<CurrentGovernanceAddresses | null> => {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
  if (!chainInfo) {
    return null;
  }

  return {
    governanceAddress:
      chainInfo.l1ContractAddresses.governanceAddress.toLowerCase(),
    governanceProposerAddress:
      chainInfo.l1ContractAddresses.governanceProposerAddress.toLowerCase(),
    currentL1ContractAddresses: Object.values(chainInfo.l1ContractAddresses).map(
      (address) => address.toLowerCase(),
    ),
  };
};

const getCurrentGovernanceProposerAddress = async (): Promise<string | null> =>
  (await getCurrentGovernanceAddresses())?.governanceProposerAddress ?? null;

const getCurrentGovernancePayloadAddresses = async (): Promise<string[] | null> => {
  const currentAddresses = await getCurrentGovernanceAddresses();
  if (!currentAddresses) {
    return null;
  }
  const currentResetStartBlock = await getCurrentL1ResetStartBlock();

  const conditions: SQL[] = [
    sql`lower(${l1GovernanceProposalsTable.governanceProposerAddress}) = ${currentAddresses.governanceProposerAddress}`,
  ];
  if (currentResetStartBlock) {
    conditions.push(
      gte(l1GovernanceProposalsTable.l1BlockNumber, currentResetStartBlock),
    );
  }

  const rows = await db()
    .select({
      payloadAddress: l1GovernanceProposalsTable.payloadAddress,
      originalPayloadAddress: l1GovernanceProposalsTable.originalPayloadAddress,
    })
    .from(l1GovernanceProposalsTable)
    .where(and(...conditions));

  return Array.from(
    new Set(
      rows.flatMap((row) =>
        [row.payloadAddress, row.originalPayloadAddress]
          .filter((address): address is string => address !== null)
          .map((address) => address.toLowerCase()),
      ),
    ),
  );
};

const getCurrentL1ResetStartBlock = async (): Promise<bigint | null> => {
  const currentAddresses = await getCurrentGovernanceAddresses();
  if (!currentAddresses) {
    return null;
  }

  const [resetAnchor] = await db()
    .select({
      l1BlockNumber: sql<bigint>`min(${l1GenericContractEventTable.l1BlockNumber})`,
    })
    .from(l1GenericContractEventTable)
    .where(
      inArray(
        l1GenericContractEventTable.l1ContractAddress,
        currentAddresses.currentL1ContractAddresses,
      ),
    );

  return resetAnchor?.l1BlockNumber ?? null;
};

const getCurrentGovernanceStartBlock = async (): Promise<bigint | null> => {
  const currentAddresses = await getCurrentGovernanceAddresses();
  if (!currentAddresses) {
    return null;
  }

  const currentResetStartBlock = await getCurrentL1ResetStartBlock();
  if (currentResetStartBlock) {
    return currentResetStartBlock;
  }

  const [genericEventAnchor] = await db()
    .select({
      l1BlockNumber: sql<bigint>`min(${l1GenericContractEventTable.l1BlockNumber})`,
    })
    .from(l1GenericContractEventTable)
    .where(
      inArray(l1GenericContractEventTable.l1ContractAddress, [
        currentAddresses.governanceAddress,
        currentAddresses.governanceProposerAddress,
      ]),
    );

  if (genericEventAnchor?.l1BlockNumber) {
    return genericEventAnchor.l1BlockNumber;
  }

  const proposalAnchor = await db()
    .select({ l1BlockNumber: l1GovernanceProposalsTable.l1BlockNumber })
    .from(l1GovernanceProposalsTable)
    .where(
      sql`lower(${l1GovernanceProposalsTable.governanceProposerAddress}) = ${currentAddresses.governanceProposerAddress}`,
    )
    .orderBy(asc(l1GovernanceProposalsTable.l1BlockNumber))
    .limit(1);

  const proposerHistoryAnchor = await db()
    .select({ l1BlockNumber: l1GovernanceProposerHistoryTable.l1BlockNumber })
    .from(l1GovernanceProposerHistoryTable)
    .where(
      sql`lower(${l1GovernanceProposerHistoryTable.governanceProposerAddress}) = ${currentAddresses.governanceProposerAddress}`,
    )
    .orderBy(asc(l1GovernanceProposerHistoryTable.l1BlockNumber))
    .limit(1);

  const anchors = [
    proposalAnchor[0]?.l1BlockNumber,
    proposerHistoryAnchor[0]?.l1BlockNumber,
  ].filter((l1BlockNumber): l1BlockNumber is bigint => l1BlockNumber !== undefined);

  return anchors.length > 0
    ? anchors.reduce((lowest, current) => (current < lowest ? current : lowest))
    : null;
};

const getCurrentGovernanceSignalFilter = async (): Promise<SQL | null | undefined> => {
  const payloadAddresses = await getCurrentGovernancePayloadAddresses();
  if (payloadAddresses === null) {
    return undefined;
  }
  if (payloadAddresses.length === 0) {
    return null;
  }

  return sql`lower(${l1GovernanceSignalsTable.payloadAddress}) = any(${payloadAddresses})`;
};

// ── Proposals ────────────────────────────────────────────────────────────────

export const getProposals = async (params?: {
  state?: ProposalState;
  from?: number;
  to?: number;
  offset?: number;
  limit?: number;
}) => {
  const { state, offset = 0, limit = 20 } = params ?? {};
  const governanceProposerAddress = await getCurrentGovernanceProposerAddress();
  const currentResetStartBlock = await getCurrentL1ResetStartBlock();

  const conditions: SQL[] = [];
  if (governanceProposerAddress) {
    conditions.push(
      sql`lower(${l1GovernanceProposalsTable.governanceProposerAddress}) = ${governanceProposerAddress}`,
    );
  }
  if (currentResetStartBlock) {
    conditions.push(
      gte(l1GovernanceProposalsTable.l1BlockNumber, currentResetStartBlock),
    );
  }
  if (state) {
    conditions.push(eq(l1GovernanceProposalsTable.state, state));
  }

  const rows = await db()
    .select()
    .from(l1GovernanceProposalsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(l1GovernanceProposalsTable.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(flattenProposalMetadata);
};

export const getProposalById = async (proposalId: string) => {
  const governanceProposerAddress = await getCurrentGovernanceProposerAddress();
  const currentResetStartBlock = await getCurrentL1ResetStartBlock();
  const conditions: SQL[] = [
    eq(l1GovernanceProposalsTable.proposalId, proposalId),
  ];
  if (governanceProposerAddress) {
    conditions.push(
      sql`lower(${l1GovernanceProposalsTable.governanceProposerAddress}) = ${governanceProposerAddress}`,
    );
  }
  if (currentResetStartBlock) {
    conditions.push(
      gte(l1GovernanceProposalsTable.l1BlockNumber, currentResetStartBlock),
    );
  }

  const results = await db()
    .select()
    .from(l1GovernanceProposalsTable)
    .where(and(...conditions))
    .limit(1);

  const row = results[0];
  return row ? flattenProposalMetadata(row) : null;
};

export const getProposalsMissingUri = async ({
  limit,
  lookbackDays,
}: {
  limit: number;
  lookbackDays: number;
}) => {
  const createdAfter = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const governanceProposerAddress = await getCurrentGovernanceProposerAddress();
  const currentResetStartBlock = await getCurrentL1ResetStartBlock();
  const conditions: SQL[] = [
    isNull(l1GovernanceProposalsTable.uri),
    gte(l1GovernanceProposalsTable.createdAt, createdAfter),
  ];

  if (governanceProposerAddress) {
    conditions.push(
      sql`lower(${l1GovernanceProposalsTable.governanceProposerAddress}) = ${governanceProposerAddress}`,
    );
  }
  if (currentResetStartBlock) {
    conditions.push(
      gte(l1GovernanceProposalsTable.l1BlockNumber, currentResetStartBlock),
    );
  }

  return await db()
    .select({
      proposalId: l1GovernanceProposalsTable.proposalId,
      proposalAddress: l1GovernanceProposalsTable.payloadAddress,
      l1BlockNumber: l1GovernanceProposalsTable.l1BlockNumber,
    })
    .from(l1GovernanceProposalsTable)
    .where(and(...conditions))
    .orderBy(asc(l1GovernanceProposalsTable.createdAt))
    .limit(limit);
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
  const governanceProposerAddress = await getCurrentGovernanceProposerAddress();
  const currentResetStartBlock = await getCurrentL1ResetStartBlock();

  const conditions: SQL[] = [eq(l1GovernanceVotesTable.proposalId, proposalId)];
  if (support !== undefined) {
    conditions.push(eq(l1GovernanceVotesTable.support, support));
  }

  if (!governanceProposerAddress) {
    return await db()
      .select()
      .from(l1GovernanceVotesTable)
      .where(and(...conditions))
      .orderBy(desc(l1GovernanceVotesTable.l1BlockNumber))
      .limit(limit)
      .offset(offset);
  }

  return await db()
    .select(getTableColumns(l1GovernanceVotesTable))
    .from(l1GovernanceVotesTable)
    .innerJoin(
      l1GovernanceProposalsTable,
      eq(
        l1GovernanceVotesTable.proposalId,
        l1GovernanceProposalsTable.proposalId,
      ),
    )
    .where(
      and(
        ...conditions,
        sql`lower(${l1GovernanceProposalsTable.governanceProposerAddress}) = ${governanceProposerAddress}`,
        currentResetStartBlock
          ? gte(l1GovernanceProposalsTable.l1BlockNumber, currentResetStartBlock)
          : undefined,
      ),
    )
    .orderBy(desc(l1GovernanceVotesTable.l1BlockNumber))
    .limit(limit)
    .offset(offset);
};

export const getProposalSignals = async (
  payloadAddress: string,
  originalPayloadAddress?: string | null,
  params?: {
    offset?: number;
    limit?: number;
  },
) => {
  const { offset = 0, limit = 50 } = params ?? {};
  const currentSignalFilter = await getCurrentGovernanceSignalFilter();
  if (currentSignalFilter === null) {
    return [];
  }

  const addressFilter = originalPayloadAddress
    ? or(
        sql`lower(${l1GovernanceSignalsTable.payloadAddress}) = ${payloadAddress.toLowerCase()}`,
        sql`lower(${l1GovernanceSignalsTable.payloadAddress}) = ${originalPayloadAddress.toLowerCase()}`,
      )
    : sql`lower(${l1GovernanceSignalsTable.payloadAddress}) = ${payloadAddress.toLowerCase()}`;
  const whereFilter = currentSignalFilter
    ? and(addressFilter, currentSignalFilter)
    : addressFilter;

  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(whereFilter)
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
  const currentSignalFilter = await getCurrentGovernanceSignalFilter();
  if (currentSignalFilter === null) {
    return [];
  }

  const conditions: SQL[] = [];
  if (currentSignalFilter) {
    conditions.push(currentSignalFilter);
  }
  if (payloadAddress) {
    conditions.push(
      sql`lower(${l1GovernanceSignalsTable.payloadAddress}) = ${payloadAddress.toLowerCase()}`,
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
  const currentSignalFilter = await getCurrentGovernanceSignalFilter();
  if (currentSignalFilter === null) {
    return [];
  }
  const roundFilter = eq(l1GovernanceSignalsTable.round, round);

  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(
      currentSignalFilter ? and(roundFilter, currentSignalFilter) : roundFilter,
    )
    .orderBy(desc(l1GovernanceSignalsTable.l1BlockNumber));
};

export const getSignalsByPayload = async (payloadAddress: string) => {
  const currentSignalFilter = await getCurrentGovernanceSignalFilter();
  if (currentSignalFilter === null) {
    return [];
  }
  const payloadFilter = sql`lower(${l1GovernanceSignalsTable.payloadAddress}) = ${payloadAddress.toLowerCase()}`;

  return await db()
    .select()
    .from(l1GovernanceSignalsTable)
    .where(
      currentSignalFilter ? and(payloadFilter, currentSignalFilter) : payloadFilter,
    )
    .orderBy(desc(l1GovernanceSignalsTable.l1BlockNumber));
};

// ── Payload Rounds ───────────────────────────────────────────────────────────

export const getPayloadRounds = async () => {
  const payloadAddresses = await getCurrentGovernancePayloadAddresses();
  if (payloadAddresses?.length === 0) {
    return [];
  }

  return await db()
    .select()
    .from(l1GovernancePayloadRoundsTable)
    .where(
      payloadAddresses
        ? sql`lower(${l1GovernancePayloadRoundsTable.payloadAddress}) = any(${payloadAddresses})`
        : undefined,
    )
    .orderBy(
      desc(l1GovernancePayloadRoundsTable.round),
      desc(l1GovernancePayloadRoundsTable.signalCount),
    );
};

export const getPayloadRound = async (
  payloadAddress: string,
  round: bigint,
) => {
  const payloadAddresses = await getCurrentGovernancePayloadAddresses();
  if (payloadAddresses?.length === 0) {
    return null;
  }

  const results = await db()
    .select()
    .from(l1GovernancePayloadRoundsTable)
    .where(
      and(
        sql`lower(${l1GovernancePayloadRoundsTable.payloadAddress}) = ${payloadAddress.toLowerCase()}`,
        eq(l1GovernancePayloadRoundsTable.round, round),
        payloadAddresses
          ? sql`lower(${l1GovernancePayloadRoundsTable.payloadAddress}) = any(${payloadAddresses})`
          : undefined,
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
  const currentGovernanceStartBlock = await getCurrentGovernanceStartBlock();

  return await db()
    .select()
    .from(l1GovernanceConfigurationsTable)
    .where(
      currentGovernanceStartBlock
        ? gte(
            l1GovernanceConfigurationsTable.l1BlockNumber,
            currentGovernanceStartBlock,
          )
        : undefined,
    )
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
  const governanceProposerAddress = await getCurrentGovernanceProposerAddress();

  return await db()
    .select()
    .from(l1GovernanceProposerHistoryTable)
    .where(
      governanceProposerAddress
        ? sql`lower(${l1GovernanceProposerHistoryTable.governanceProposerAddress}) = ${governanceProposerAddress}`
        : undefined,
    )
    .orderBy(desc(l1GovernanceProposerHistoryTable.updatedAt))
    .limit(limit)
    .offset(offset);
};
