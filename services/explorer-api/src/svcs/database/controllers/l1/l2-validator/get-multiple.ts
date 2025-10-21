import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozValidatorWithSentinel,
  L1L2ValidatorStatus,
  SentinelFilterEnum,
} from "@chicmoz-pkg/types";
import { l1Schemas, sentinelSchemas } from "@chicmoz-pkg/database-registry";
import { asc, count, desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { getL2ChainInfo } from "../../l2/index.js";
import { logger } from "../../../../../logger.js";

import {
  buildLatestStakeSubquery,
  buildLatestStatusSubquery,
  buildValidatorSelect,
  mapRowToValidator,
} from "./util.js";

const { l1L2ValidatorTable } = l1Schemas;

const { SentinelValidatorTable } = sentinelSchemas;

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
    const latestStakes = buildLatestStakeSubquery(dbTx);

    const pickedOrder = pickOrder(order);

    const safeLimit = Math.max(1, Math.min(limit, 500));
    const safeOffset = Math.max(0, offset);

    const rows = await buildValidatorSelect(dbTx, latestStatuses, latestStakes)
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

export async function getValidatorTotals(): Promise<{
  validating: number;
  nonValidating: number;
}> {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);

  if (!chainInfo) {
    logger.error("Chain info not found");
    return { validating: 0, nonValidating: 0 };
  }

  return db().transaction(async (dbTx) => {
    const latestStatuses = buildLatestStatusSubquery(dbTx);

    // Count validators by status, filtered by rollup address
    const result = await dbTx
      .select({
        status: latestStatuses.status,
        count: count(),
      })
      .from(latestStatuses)
      .innerJoin(
        l1L2ValidatorTable,
        eq(latestStatuses.attesterAddress, l1L2ValidatorTable.attester),
      )
      .where(
        eq(
          l1L2ValidatorTable.rollupAddress,
          chainInfo.l1ContractAddresses.rollupAddress,
        ),
      )
      .groupBy(latestStatuses.status);

    // Extract counts
    const validating =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      result.find((row) => row.status === L1L2ValidatorStatus.VALIDATING)
        ?.count ?? 0;

    const nonValidating = result.length - validating;

    return { validating, nonValidating };
  });
}
