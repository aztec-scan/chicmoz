import { L1L2ValidatorEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL1L2Validator, L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { logger } from "../../../../../logger.js";
import {
  l1L2ValidatorProposerTable,
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
  l1L2ValidatorWithdrawerTable,
} from "../../../schema/l1/l2-validator.js";
import { getAllL1L2Validators } from "./get-multiple.js";
import { getL1L2Validator } from "./get-single.js";

export async function updateValidatorsState(
  event: L1L2ValidatorEvent,
): Promise<void> {
  const validators = event.validators.map((validator) => ({
    ...validator,
    stake: BigInt(validator.stake),
  }));
  const currentDbValues = await getAllL1L2Validators();
  if (currentDbValues === null) {
    return;
  }
  for (const validator of currentDbValues) {
    const foundAndIsNotAlreadyExiting = validators.find(
      (v) =>
        v.attester === validator.attester &&
        v.status !== L1L2ValidatorStatus.EXITING,
    );
    if (!foundAndIsNotAlreadyExiting) {
      logger.info(
        `🤖 L1L2 validator ${validator.attester} not found in event, setting to EXITING`,
      );
      await _store(
        {
          ...validator,
          latestSeenChangeAt: new Date(),
          status: L1L2ValidatorStatus.EXITING,
          stake: 0n,
        },
        validator,
      );
    }
  }
  for (const validator of validators) {
    const found = currentDbValues.find(
      (v) => v.attester === validator.attester,
    );
    const currentValues = found
      ? found
      : await getL1L2Validator(validator.attester, validator.rollupAddress);
    await _store(validator, currentValues);
  }
}

async function _store(
  toStore: ChicmozL1L2Validator,
  currentDbValues: ChicmozL1L2Validator | null,
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
  } = toStore;

  await db().transaction(async (tx) => {
    if (!currentDbValues) {
      await tx
        .insert(l1L2ValidatorTable)
        .values({ attester, rollupAddress, firstSeenAt });
    }

    if (
      !currentDbValues ||
      (currentDbValues && currentDbValues.stake !== stake)
    ) {
      await tx.insert(l1L2ValidatorStakeTable).values({
        attesterAddress: attester,
        stake: stake.toString(),
        timestamp: latestSeenChangeAt,
      });
    }
    if (
      !currentDbValues ||
      (currentDbValues && currentDbValues.status !== status)
    ) {
      await tx.insert(l1L2ValidatorStatusTable).values({
        attesterAddress: attester,
        status,
        timestamp: latestSeenChangeAt,
      });
    }
    if (
      !currentDbValues ||
      (currentDbValues && currentDbValues.withdrawer !== withdrawer)
    ) {
      await tx.insert(l1L2ValidatorWithdrawerTable).values({
        attesterAddress: attester,
        withdrawer,
        timestamp: latestSeenChangeAt,
      });
    }
    if (
      !currentDbValues ||
      (currentDbValues && currentDbValues.proposer !== proposer)
    ) {
      await tx.insert(l1L2ValidatorProposerTable).values({
        attesterAddress: attester,
        proposer,
        timestamp: latestSeenChangeAt,
      });
    }
  });
}

export async function storeL1L2Validator(
  validator: ChicmozL1L2Validator,
): Promise<void> {
  const currentDbValues = await getL1L2Validator(validator.attester);
  await _store(validator, currentDbValues);
}
