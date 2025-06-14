import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozChainInfo,
  ChicmozL1L2Validator,
  EthAddress,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { and, desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { logger } from "../../../../../logger.js";
import {
  l1L2ValidatorProposerTable,
  l1L2ValidatorRollupAddress,
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
  l1L2ValidatorWithdrawerTable,
} from "../../../schema/l1/l2-validator.js";
import { getL2ChainInfo } from "../../l2/index.js";

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
    const latestRollupAddress = dbTx
      .selectDistinctOn([l1L2ValidatorRollupAddress.attesterAddress], {
        attesterAddress: l1L2ValidatorRollupAddress.attesterAddress,
        rollupAddress: l1L2ValidatorRollupAddress.rollupAddress,
        timestamp: l1L2ValidatorRollupAddress.timestamp,
      })
      .from(l1L2ValidatorRollupAddress)
      .where(eq(l1L2ValidatorRollupAddress.attesterAddress, attesterAddress))
      .orderBy(
        l1L2ValidatorRollupAddress.attesterAddress,
        desc(l1L2ValidatorRollupAddress.timestamp),
      )
      .as("latest_rollup_address");

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

    const latestWithdrawer = dbTx
      .selectDistinctOn([l1L2ValidatorWithdrawerTable.attesterAddress], {
        attesterAddress: l1L2ValidatorWithdrawerTable.attesterAddress,
        withdrawer: l1L2ValidatorWithdrawerTable.withdrawer,
        timestamp: l1L2ValidatorWithdrawerTable.timestamp,
      })
      .from(l1L2ValidatorWithdrawerTable)
      .where(eq(l1L2ValidatorWithdrawerTable.attesterAddress, attesterAddress))
      .orderBy(
        l1L2ValidatorWithdrawerTable.attesterAddress,
        desc(l1L2ValidatorWithdrawerTable.timestamp),
      )
      .as("latest_withdrawer");

    const latestProposer = dbTx
      .selectDistinctOn([l1L2ValidatorProposerTable.attesterAddress], {
        attesterAddress: l1L2ValidatorProposerTable.attesterAddress,
        proposer: l1L2ValidatorProposerTable.proposer,
        timestamp: l1L2ValidatorProposerTable.timestamp,
      })
      .from(l1L2ValidatorProposerTable)
      .where(eq(l1L2ValidatorProposerTable.attesterAddress, attesterAddress))
      .orderBy(
        l1L2ValidatorProposerTable.attesterAddress,
        desc(l1L2ValidatorProposerTable.timestamp),
      )
      .as("latest_proposer");

    // Main query with joins
    const result = await dbTx
      .select({
        attester: l1L2ValidatorTable.attester,
        rollupAddress: latestRollupAddress.rollupAddress,
        firstSeenAt: l1L2ValidatorTable.firstSeenAt,
        stake: latestStake.stake,
        status: latestStatus.status,
        withdrawer: latestWithdrawer.withdrawer,
        proposer: latestProposer.proposer,
        stakeTimestamp: latestStake.timestamp,
        statusTimestamp: latestStatus.timestamp,
        withdrawerTimestamp: latestWithdrawer.timestamp,
        proposerTimestamp: latestProposer.timestamp,
      })
      .from(l1L2ValidatorTable)
      .leftJoin(
        latestRollupAddress,
        eq(latestRollupAddress.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestStake,
        eq(latestStake.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestStatus,
        eq(latestStatus.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestWithdrawer,
        eq(latestWithdrawer.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestProposer,
        eq(latestProposer.attesterAddress, l1L2ValidatorTable.attester),
      )
      .where(
        and(
          eq(l1L2ValidatorTable.attester, attesterAddress),
          eq(latestRollupAddress.rollupAddress, targetRollupAddress),
        ),
      )
      .limit(1);

    if (result.length === 0 || !result[0].attester) {
      return null;
    }

    const row = result[0];
    const latestSeenChangeAt = new Date(
      Math.max(
        row.stakeTimestamp?.getTime() ?? 0,
        row.statusTimestamp?.getTime() ?? 0,
        row.withdrawerTimestamp?.getTime() ?? 0,
        row.proposerTimestamp?.getTime() ?? 0,
      ),
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
