import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL1L2Validator,
  chicmozL1L2ValidatorSchema,
  L1L2ValidatorStatus,
} from "@chicmoz-pkg/types";
import { count, desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { l1Schemas } from "@chicmoz-pkg/database-registry";
import { logger } from "../../../../../logger.js";
const {
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
} = l1Schemas

import { getL2ChainInfo } from "../../l2/index.js";

export async function getAllL1L2Validators(
  status?: ChicmozL1L2Validator["status"],
  options?: { limit?: number; offset?: number },
): Promise<ChicmozL1L2Validator[] | null> {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);

  if (!chainInfo) {
    logger.error("Chain info not found");
    return null;
  }

  return db().transaction(async (dbTx) => {
    const latestStakes = dbTx
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

    const latestStatuses = dbTx
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

    // Main query with joins
    const result = await dbTx
      .select({
        attester: l1L2ValidatorTable.attester,
        rollupAddress: l1L2ValidatorTable.rollupAddress,
        firstSeenAt: l1L2ValidatorTable.firstSeenAt,
        stake: latestStakes.stake,
        status: latestStatuses.status,
        withdrawer: l1L2ValidatorTable.withdrawer,
        proposer: l1L2ValidatorTable.proposer,
        stakeTimestamp: latestStakes.timestamp,
        statusTimestamp: latestStatuses.timestamp,
      })
      .from(l1L2ValidatorTable)
      .leftJoin(
        latestStakes,
        eq(latestStakes.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestStatuses,
        eq(latestStatuses.attesterAddress, l1L2ValidatorTable.attester),
      )
      .where(
        eq(
          l1L2ValidatorTable.rollupAddress,
          chainInfo.l1ContractAddresses.rollupAddress,
        ),
      )
      .orderBy(desc(latestStakes.stake), desc(l1L2ValidatorTable.firstSeenAt))
      .limit(options?.limit ?? 1000)
      .offset(options?.offset ?? 0);

    // Transform the result to match ChicmozL1L2Validator schema
    const validators = result
      .map((row) => {
        if (!row.attester) {
          return null;
        }

        const latestSeenChangeAt = Math.max(
          row.stakeTimestamp ?? 0,
          row.statusTimestamp ?? 0,
        );

        const validator = {
          attester: row.attester,
          rollupAddress: row.rollupAddress,
          firstSeenAt: row.firstSeenAt,
          stake: row.stake ? BigInt(row.stake) : BigInt(0),
          status: row.status,
          withdrawer: row.withdrawer,
          proposer: row.proposer,
          latestSeenChangeAt,
        };

        return chicmozL1L2ValidatorSchema.parse(validator);
      })
      .filter((v) => v !== null && (status ? v.status === status : true))
      .map((v) => chicmozL1L2ValidatorSchema.parse(v));

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
    // Get the latest statuses for each validator
    const latestStatuses = dbTx
      .selectDistinctOn([l1L2ValidatorStatusTable.attesterAddress], {
        attesterAddress: l1L2ValidatorStatusTable.attesterAddress,
        status: l1L2ValidatorStatusTable.status,
      })
      .from(l1L2ValidatorStatusTable)
      .orderBy(
        l1L2ValidatorStatusTable.attesterAddress,
        desc(l1L2ValidatorStatusTable.timestamp),
      )
      .as("latest_statuses");

    // Count validators by status, filtered by rollup address
    const result = await dbTx
      .select({
        status: latestStatuses.status,
        count: count(),
      })
      .from(latestStatuses)
      .innerJoin(
        l1L2ValidatorRollupAddress,
        eq(
          latestStatuses.attesterAddress,
          l1L2ValidatorRollupAddress.attesterAddress,
        ),
      )
      .where(
        eq(
          l1L2ValidatorRollupAddress.rollupAddress,
          chainInfo.l1ContractAddresses.rollupAddress,
        ),
      )
      .groupBy(latestStatuses.status);

    // Extract counts
    const validating =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      result.find((row) => row.status === L1L2ValidatorStatus.VALIDATING)
        ?.count ?? 0;

    const nonValidating = result
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      .filter((row) => row.status !== L1L2ValidatorStatus.VALIDATING)
      .reduce((sum, row) => sum + row.count, 0);

    return { validating, nonValidating };
  });
}
