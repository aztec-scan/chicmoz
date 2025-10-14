import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozChainInfo,
  ChicmozL1L2Validator,
  EthAddress,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { and, desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { l1Schemas } from "@chicmoz-pkg/database-registry";
import { logger } from "../../../../../logger.js";
import { getL2ChainInfo } from "../../l2/index.js";

const {
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
} = l1Schemas

export async function getL1L2Validator(
  attesterAddress: EthAddress,
  rollupAddress?: EthAddress,
): Promise<ChicmozL1L2Validator | null> {
  let chainInfo: ChicmozChainInfo | null = null;
  if (!rollupAddress) {
    chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
    if (chainInfo === null) {
      logger.error("Chain info not found");
      return null;
    }
  }

  const targetRollupAddress =
    rollupAddress ?? chainInfo!.l1ContractAddresses.rollupAddress;

  return db().transaction(async (dbTx) => {
    const latestStake = dbTx
      .selectDistinctOn([l1L2ValidatorStakeTable.attesterAddress], {
        attesterAddress: l1L2ValidatorStakeTable.attesterAddress,
        stake: l1L2ValidatorStakeTable.stake,
        timestamp: l1L2ValidatorStakeTable.timestamp,
      })
      .from(l1L2ValidatorStakeTable)
      .where(eq(l1L2ValidatorStakeTable.attesterAddress, attesterAddress))
      .orderBy(
        l1L2ValidatorStakeTable.attesterAddress,
        desc(l1L2ValidatorStakeTable.timestamp),
      )
      .as("latest_stake");

    const latestStatus = dbTx
      .selectDistinctOn([l1L2ValidatorStatusTable.attesterAddress], {
        attesterAddress: l1L2ValidatorStatusTable.attesterAddress,
        status: l1L2ValidatorStatusTable.status,
        timestamp: l1L2ValidatorStatusTable.timestamp,
      })
      .from(l1L2ValidatorStatusTable)
      .where(eq(l1L2ValidatorStatusTable.attesterAddress, attesterAddress))
      .orderBy(
        l1L2ValidatorStatusTable.attesterAddress,
        desc(l1L2ValidatorStatusTable.timestamp),
      )
      .as("latest_status");
    // Main query with joins
    const result = await dbTx
      .select({
        attester: l1L2ValidatorTable.attester,
        rollupAddress: l1L2ValidatorTable.rollupAddress,
        firstSeenAt: l1L2ValidatorTable.firstSeenAt,
        stake: latestStake.stake,
        status: latestStatus.status,
        withdrawer: l1L2ValidatorTable.withdrawer,
        proposer: l1L2ValidatorTable.proposer,
        stakeTimestamp: latestStake.timestamp,
        statusTimestamp: latestStatus.timestamp,
      })
      .from(l1L2ValidatorTable)
      .leftJoin(
        latestStake,
        eq(latestStake.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestStatus,
        eq(latestStatus.attesterAddress, l1L2ValidatorTable.attester),
      )
      .where(
        and(
          eq(l1L2ValidatorTable.attester, attesterAddress),
          eq(l1L2ValidatorTable.rollupAddress, targetRollupAddress),
        ),
      )
      .limit(1);

    if (result.length === 0 || !result[0].attester) {
      return null;
    }

    const row = result[0];
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
  });
}
