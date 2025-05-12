import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import {
  l1L2ValidatorProposerTable,
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
  l1L2ValidatorWithdrawerTable,
} from "../../../schema/l1/l2-validator.js";
import { getL1L2Validator } from "./get-single.js";

export async function storeL1L2Validator(
  validator: ChicmozL1L2Validator,
): Promise<void> {
  const {
    attester,
    rollupAddress,
    firstSeenAt,
    stake,
    status,
    withdrawer,
    proposer,
    latestSeenChangeAt,
  } = validator;

  const currentValues = await getL1L2Validator(attester);
  await db().transaction(async (tx) => {
    if (!currentValues) {
      await tx
        .insert(l1L2ValidatorTable)
        .values({ attester, rollupAddress, firstSeenAt });
    }

    if (!currentValues || (currentValues && currentValues.stake !== stake)) {
      await tx.insert(l1L2ValidatorStakeTable).values({
        attesterAddress: attester,
        stake: stake.toString(),
        timestamp: latestSeenChangeAt,
      });
    }
    if (!currentValues || (currentValues && currentValues.status !== status)) {
      await tx.insert(l1L2ValidatorStatusTable).values({
        attesterAddress: attester,
        status,
        timestamp: latestSeenChangeAt,
      });
    }
    if (
      !currentValues ||
      (currentValues && currentValues.withdrawer !== withdrawer)
    ) {
      await tx.insert(l1L2ValidatorWithdrawerTable).values({
        attesterAddress: attester,
        withdrawer,
        timestamp: latestSeenChangeAt,
      });
    }
    if (
      !currentValues ||
      (currentValues && currentValues.proposer !== proposer)
    ) {
      await tx.insert(l1L2ValidatorProposerTable).values({
        attesterAddress: attester,
        proposer,
        timestamp: latestSeenChangeAt,
      });
    }
  });
}
