import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozValidatorWithSentinel,
  L1L2ValidatorStatus,
  SentinelHistory,
  chicmozValidatorWithSentinelSchema,
} from "@chicmoz-pkg/types";
import { l1Schemas, sentinelSchemas } from "@chicmoz-pkg/database-registry";
import { desc, eq } from "drizzle-orm";

const {
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
  l1L2ValidatorStakeTable,
} = l1Schemas;

const { SentinelValidatorTable, SentinelBlockTable, SentinelAttestationTable } =
  sentinelSchemas;

type DatabaseClient = ReturnType<typeof db>;
type TransactionFunction = DatabaseClient["transaction"];
type TransactionCallback = Parameters<TransactionFunction>[0];
type TransactionClient = Parameters<TransactionCallback>[0];
type DbClient = DatabaseClient | TransactionClient;

export type ValidatorRow = {
  attester: string | null;
  rollupAddress: string | null;
  firstSeenAt: number | null;
  withdrawer: string | null;
  proposer: string | null;
  status: number | null;
  stake: bigint | null;
  statusTimestamp: number | null;
  sentinelValidator: {
    totalSlots: number | null;
    lastSeenAt: number | null;
    lastSeenAtSlot: bigint | null;
  } | null;
  sentinelBlocks: {
    total: number | null;
    missed: number | null;
    lastSeenAt: number | null;
    lastSeenAtSlot: bigint | null;
  } | null;
  sentinelAttestations: {
    total: number | null;
    missed: number | null;
    lastSeenAt: number | null;
    lastSeenAtSlot: bigint | null;
  } | null;
};

export const mapRowToValidator = (
  row: ValidatorRow,
  history?: SentinelHistory[],
): ChicmozValidatorWithSentinel | null => {
  if (!row.attester || !row.rollupAddress) {
    return null;
  }

  const sentinelValidator = row.sentinelValidator;
  const sentinelBlocks = row.sentinelBlocks ?? undefined;
  const sentinelAttestations = row.sentinelAttestations ?? undefined;
  const sentinelLastSeenAt = sentinelValidator?.lastSeenAt;

  const latestSeenChangeAt = row.statusTimestamp ?? 0;

  const validator: ChicmozValidatorWithSentinel =
    chicmozValidatorWithSentinelSchema.parse({
      attester: row.attester,
      rollupAddress: row.rollupAddress,
      firstSeenAt: row.firstSeenAt,
      stake: row.stake,
      status: (row.status ?? L1L2ValidatorStatus.NONE) as L1L2ValidatorStatus,
      withdrawer: row.withdrawer ?? row.attester,
      proposer: row.proposer ?? row.attester,
      latestSeenChangeAt,
      totalSlots: sentinelValidator?.totalSlots ?? 0,
      lastSeenAt: sentinelLastSeenAt ?? undefined,
      lastSeenAtSlot: sentinelValidator?.lastSeenAtSlot ?? undefined,
      blocks: sentinelBlocks,
      attestations: sentinelAttestations,
      history,
    });

  return validator;
};

export const buildLatestStatusSubquery = (dbTx: DbClient) => {
  return dbTx
    .selectDistinctOn([l1L2ValidatorStatusTable.attesterAddress], {
      attesterAddress: l1L2ValidatorStatusTable.attesterAddress,
      status: l1L2ValidatorStatusTable.status,
      timestamp: l1L2ValidatorStatusTable.timestamp,
    })
    .from(l1L2ValidatorStatusTable)
    .orderBy(
      l1L2ValidatorStatusTable.attesterAddress,
      desc(l1L2ValidatorStatusTable.timestamp),
    )
    .as("latest_statuses");
};

export const buildLatestStakeSubquery = (dbTx: DbClient) => {
  return dbTx
    .selectDistinctOn([l1L2ValidatorStakeTable.attesterAddress], {
      attesterAddress: l1L2ValidatorStakeTable.attesterAddress,
      stake: l1L2ValidatorStakeTable.stake,
      timestamp: l1L2ValidatorStakeTable.timestamp,
    })
    .from(l1L2ValidatorStakeTable)
    .orderBy(
      l1L2ValidatorStakeTable.attesterAddress,
      desc(l1L2ValidatorStakeTable.timestamp),
    )
    .as("latest_stakes");
};

export const buildValidatorSelect = (
  dbTx: DbClient,
  latestStatuses: ReturnType<typeof buildLatestStatusSubquery>,
  latestStakes: ReturnType<typeof buildLatestStakeSubquery>,
) => {
  return dbTx
    .select({
      attester: l1L2ValidatorTable.attester,
      rollupAddress: l1L2ValidatorTable.rollupAddress,
      firstSeenAt: l1L2ValidatorTable.firstSeenAt,
      withdrawer: l1L2ValidatorTable.withdrawer,
      proposer: l1L2ValidatorTable.proposer,
      stake: latestStakes.stake,
      status: latestStatuses.status,
      statusTimestamp: latestStatuses.timestamp,
      sentinelValidator: {
        totalSlots: SentinelValidatorTable.totalSlots,
        lastSeenAt: SentinelValidatorTable.lastSeenAt,
        lastSeenAtSlot: SentinelValidatorTable.lastSeenAtSlot,
      },
      sentinelBlocks: {
        total: SentinelBlockTable.total,
        missed: SentinelBlockTable.missed,
        lastSeenAt: SentinelBlockTable.lastSeenAt,
        lastSeenAtSlot: SentinelBlockTable.lastSeenAtSlot,
      },
      sentinelAttestations: {
        total: SentinelAttestationTable.total,
        missed: SentinelAttestationTable.missed,
        lastSeenAt: SentinelAttestationTable.lastSeenAt,
        lastSeenAtSlot: SentinelAttestationTable.lastSeenAtSlot,
      },
    })
    .from(l1L2ValidatorTable)
    .leftJoin(
      latestStatuses,
      eq(latestStatuses.attesterAddress, l1L2ValidatorTable.attester),
    )
    .leftJoin(
      latestStakes,
      eq(latestStakes.attesterAddress, l1L2ValidatorTable.attester),
    )
    .leftJoin(
      SentinelValidatorTable,
      eq(SentinelValidatorTable.attester, l1L2ValidatorTable.attester),
    )
    .leftJoin(
      SentinelBlockTable,
      eq(SentinelBlockTable.attester, l1L2ValidatorTable.attester),
    )
    .leftJoin(
      SentinelAttestationTable,
      eq(SentinelAttestationTable.attester, l1L2ValidatorTable.attester),
    );
};
