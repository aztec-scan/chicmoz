import { L1L2ValidatorEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL1L2Validator, L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { l1Schemas } from "@chicmoz-pkg/database-registry";
import { sql } from "drizzle-orm";

import { logger } from "../../../../../logger.js";
import { getAllL1L2Validators } from "./get-multiple.js";
import { getL1L2Validator } from "./get-single.js";

const {
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
} = l1Schemas

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


// TODO: ensure this is data is sane and useful across multiple rollup_addresses, this might need a rework of the table itself too
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
    await tx
      .insert(l1L2ValidatorTable)
      .values({ attester, firstSeenAt, rollupAddress, withdrawer, proposer })
      .onConflictDoUpdate({
        target: l1L2ValidatorTable.attester,
        set: {
          firstSeenAt: sql`EXCLUDED.first_seen_at`,
          rollupAddress: sql`EXCLUDED.rollup_address`,
          withdrawer: sql`EXCLUDED.withdrawer`,
          proposer: sql`EXCLUDED.proposer`,
        },
        where: sql`
          ${l1L2ValidatorTable.firstSeenAt} IS DISTINCT FROM EXCLUDED.first_seen_at OR
          ${l1L2ValidatorTable.withdrawer} IS DISTINCT FROM EXCLUDED.withdrawer OR
          ${l1L2ValidatorTable.proposer} IS DISTINCT FROM EXCLUDED.proposer
        `,
      });

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
  });
}

export async function storeL1L2Validator(
  validator: ChicmozL1L2Validator,
): Promise<void> {
  const currentDbValues = await getL1L2Validator(validator.attester);
  await _store(validator, currentDbValues);
}
