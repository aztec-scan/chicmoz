import { L1L2ValidatorEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL1L2Validator, L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { logger } from "../../../../../logger.js";
import {
  l1L2ValidatorProposerTable,
  l1L2ValidatorRollupAddress,
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
  const eventValidators = event.validators.map((validator) => ({
    ...validator,
    stake: BigInt(validator.stake),
  }));
  const currentDbValues = await getAllL1L2Validators();
  if (currentDbValues === null) {
    return;
  }
  for (const dbValidator of currentDbValues) {
    const found = eventValidators.find(
      (eventValidator) =>
        eventValidator.attester === dbValidator.attester &&
        eventValidator.rollupAddress === dbValidator.rollupAddress,
    );
    if (!found && dbValidator.status !== L1L2ValidatorStatus.EXITING) {
      logger.info(
        `🤖 L1L2 validator ${dbValidator.attester} not found in event, setting to EXITING`,
      );
      await _store(
        {
          ...dbValidator,
          latestSeenChangeAt: new Date().getTime(),
          status: L1L2ValidatorStatus.EXITING,
          stake: 0n,
        },
        dbValidator,
      );
    }
  }
  for (const validator of eventValidators) {
    const found = currentDbValues.find(
      (v) => v.attester === validator.attester,
    );
    const currentValues = found
      ? found
      : await getL1L2Validator(validator.attester, validator.rollupAddress);
    try {
      await _store(validator, currentValues);
    } catch (error) {
      logger.error(
        `Error storing L1L2 validator ${validator.attester}: ${(error as Error).message}`,
      );
    }
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
        .values({ attester, firstSeenAt })
        .onConflictDoNothing();
    }

    if (
      !currentDbValues ||
      (currentDbValues && currentDbValues.rollupAddress !== rollupAddress)
    ) {
      await tx.insert(l1L2ValidatorRollupAddress).values({
        attesterAddress: attester,
        rollupAddress,
        timestamp: latestSeenChangeAt,
      });
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
