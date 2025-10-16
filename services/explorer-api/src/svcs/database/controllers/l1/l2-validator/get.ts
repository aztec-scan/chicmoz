import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozValidatorWithSentinel,
  EthAddress,
  L1L2ValidatorStatus,
  SentinelFilterEnum,
  SentinelHistory,
  chicmozValidatorWithSentinelSchema,
} from "@chicmoz-pkg/types";
import { l1Schemas, sentinelSchemas } from "@chicmoz-pkg/database-registry";
import { and, asc, desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { getL2ChainInfo } from "../../l2/index.js";
import { logger } from "../../../../../logger.js";

const { l1L2ValidatorStatusTable, l1L2ValidatorTable } = l1Schemas;

const {
  SentinelValidatorTable,
  SentinelBlockTable,
  SentinelAttestationTable,
  SentinelHistoryTable,
} = sentinelSchemas;

type DatabaseClient = ReturnType<typeof db>;
type TransactionFunction = DatabaseClient["transaction"];
type TransactionCallback = Parameters<TransactionFunction>[0];
type TransactionClient = Parameters<TransactionCallback>[0];
type DbClient = DatabaseClient | TransactionClient;

type ValidatorRow = {
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

const mapRowToValidator = (
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

const buildLatestStatusSubquery = (dbTx: DbClient) => {
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

const buildValidatorSelect = (
  dbTx: DbClient,
  latestStatuses: ReturnType<typeof buildLatestStatusSubquery>,
) => {
  return dbTx
    .select({
      attester: l1L2ValidatorTable.attester,
      rollupAddress: l1L2ValidatorTable.rollupAddress,
      firstSeenAt: l1L2ValidatorTable.firstSeenAt,
      withdrawer: l1L2ValidatorTable.withdrawer,
      proposer: l1L2ValidatorTable.proposer,
      stake: l1L2ValidatorTable.stake,
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

function pickOrder(order?: SentinelFilterEnum) {
  switch (order) {
    case "asc-slots":
      return asc(SentinelValidatorTable.totalSlots);
    case "desc-slots":
      return desc(SentinelValidatorTable.totalSlots);
    case "asc-latest":
      return asc(SentinelValidatorTable.lastSeenAtSlot);
    case "desc-latest":
    default:
      return desc(SentinelValidatorTable.lastSeenAtSlot);
  }
}

export type ValidatorQueryOptions = {
  order?: SentinelFilterEnum;
  limit?: number;
  offset?: number;
};

export async function getValidatorsWithSentinel(
  options: ValidatorQueryOptions = {},
): Promise<ChicmozValidatorWithSentinel[] | null> {
  const { order = "desc-latest", limit = 500, offset = 0 } = options;
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);

  if (!chainInfo) {
    logger.error("Chain info not found");
    return null;
  }

  return db().transaction(async (dbTx) => {
    const latestStatuses = buildLatestStatusSubquery(dbTx);

    const pickedOrder = pickOrder(order);

    const safeLimit = Math.max(1, Math.min(limit, 500));
    const safeOffset = Math.max(0, offset);

    const rows = await buildValidatorSelect(dbTx, latestStatuses)
      .where(
        eq(
          l1L2ValidatorTable.rollupAddress,
          chainInfo.l1ContractAddresses.rollupAddress,
        ),
      )
      .orderBy(pickedOrder)
      .limit(safeLimit)
      .offset(safeOffset);

    const validators = rows
      .map((row) => mapRowToValidator(row))
      .filter((value): value is ChicmozValidatorWithSentinel => value !== null);

    return validators;
  });
}

type SingleValidatorOptions = {
  rollupAddress?: EthAddress;
  includeHistory?: boolean;
  historyLimit?: number;
  historyOffset?: number;
};

export async function getValidatorWithSentinel(
  attesterAddress: EthAddress,
  options: SingleValidatorOptions = {},
): Promise<ChicmozValidatorWithSentinel | null> {
  const { rollupAddress, includeHistory = true } = options;

  let targetRollupAddress = rollupAddress;
  if (!targetRollupAddress) {
    const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
    if (!chainInfo) {
      logger.error("Chain info not found");
      return null;
    }
    targetRollupAddress = chainInfo.l1ContractAddresses.rollupAddress;
  }

  const historyLimit = Math.max(1, Math.min(options.historyLimit ?? 100, 500));
  const historyOffset = Math.max(0, options.historyOffset ?? 0);

  return db().transaction(async (dbTx) => {
    const latestStatuses = buildLatestStatusSubquery(dbTx);

    const rows = await buildValidatorSelect(dbTx, latestStatuses)
      .where(
        and(
          eq(l1L2ValidatorTable.attester, attesterAddress),
          eq(l1L2ValidatorTable.rollupAddress, targetRollupAddress),
        ),
      )
      .limit(1);

    if (!rows.length) {
      return null;
    }

    let history: SentinelHistory[] | undefined;
    if (includeHistory) {
      const historyRows = await dbTx
        .select({
          slot: SentinelHistoryTable.slot,
          status: SentinelHistoryTable.status,
        })
        .from(SentinelHistoryTable)
        .where(eq(SentinelHistoryTable.attester, attesterAddress))
        .orderBy(desc(SentinelHistoryTable.slot))
        .offset(historyOffset)
        .limit(historyLimit);

      history = historyRows;
    }

    return mapRowToValidator(rows[0] as ValidatorRow, history) ?? null;
  });
}
