import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL1L2Validator,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { logger } from "../../../../../logger.js";
import {
  l1L2ValidatorProposerTable,
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
  l1L2ValidatorWithdrawerTable,
} from "../../../schema/l1/l2-validator.js";
import { getL2ChainInfo } from "../../l2/index.js";

export async function getAllL1L2Validators(
  status?: ChicmozL1L2Validator["status"],
): Promise<ChicmozL1L2Validator[] | null> {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);

  if (!chainInfo) {
    logger.error("Chain info not found");
    return null;
  }

  return db().transaction(async (dbTx) => {
    // Create subqueries for latest records using DISTINCT ON
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

    const latestWithdrawers = dbTx
      .selectDistinctOn([l1L2ValidatorWithdrawerTable.attesterAddress], {
        attesterAddress: l1L2ValidatorWithdrawerTable.attesterAddress,
        withdrawer: l1L2ValidatorWithdrawerTable.withdrawer,
        timestamp: l1L2ValidatorWithdrawerTable.timestamp,
      })
      .from(l1L2ValidatorWithdrawerTable)
      .orderBy(
        l1L2ValidatorWithdrawerTable.attesterAddress,
        desc(l1L2ValidatorWithdrawerTable.timestamp),
      )
      .as("latest_withdrawers");

    const latestProposers = dbTx
      .selectDistinctOn([l1L2ValidatorProposerTable.attesterAddress], {
        attesterAddress: l1L2ValidatorProposerTable.attesterAddress,
        proposer: l1L2ValidatorProposerTable.proposer,
        timestamp: l1L2ValidatorProposerTable.timestamp,
      })
      .from(l1L2ValidatorProposerTable)
      .orderBy(
        l1L2ValidatorProposerTable.attesterAddress,
        desc(l1L2ValidatorProposerTable.timestamp),
      )
      .as("latest_proposers");

    // Main query with joins
    const result = await dbTx
      .select({
        attester: l1L2ValidatorTable.attester,
        rollupAddress: l1L2ValidatorTable.rollupAddress,
        firstSeenAt: l1L2ValidatorTable.firstSeenAt,
        stake: latestStakes.stake,
        status: latestStatuses.status,
        withdrawer: latestWithdrawers.withdrawer,
        proposer: latestProposers.proposer,
        stakeTimestamp: latestStakes.timestamp,
        statusTimestamp: latestStatuses.timestamp,
        withdrawerTimestamp: latestWithdrawers.timestamp,
        proposerTimestamp: latestProposers.timestamp,
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
      .leftJoin(
        latestWithdrawers,
        eq(latestWithdrawers.attesterAddress, l1L2ValidatorTable.attester),
      )
      .leftJoin(
        latestProposers,
        eq(latestProposers.attesterAddress, l1L2ValidatorTable.attester),
      )
      .where(
        eq(
          l1L2ValidatorTable.rollupAddress,
          chainInfo.l1ContractAddresses.rollupAddress,
        ),
      );

    // Transform the result to match ChicmozL1L2Validator schema
    const validators = result
      .map((row) => {
        if (!row.attester) {
          return null;
        }

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
      })
      .filter((v) => v !== null && (status ? v.status === status : true))
      .map((v) => chicmozL1L2ValidatorSchema.parse(v));

    return validators;
  });
}
