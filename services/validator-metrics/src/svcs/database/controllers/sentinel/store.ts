import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { EthAddress, SentinelActivity, SentinelHistory, SentinelValidatorStats } from "@chicmoz-pkg/types";

import {
  SentinelHistoryTable,
  SentinelBlockTable,
  SentinelAttestationTable,
  SentinelValidatorTable,
  CounterTable
} from "../../schema/sentinel/index.js"

import { sql } from "drizzle-orm";

export type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];


async function _storeHistoryEntry (tx: Tx, attester: EthAddress, history: SentinelHistory) {
  return tx
      .insert(SentinelHistoryTable)
      .values({ attester, slot: history.slot, status: history.status })
      .onConflictDoUpdate({
        target:[SentinelHistoryTable.attester, SentinelHistoryTable.slot],
        set: {
          status: history.status
        }
      })
}

async function _insertOrUpdateCounterTable (tx: Tx, table: CounterTable, attester: EthAddress, values: SentinelActivity) {
  const insertValues: SentinelActivity = {
    total: values.total,
    missed: values.missed,
  };

  if (values.lastSeenAt !== undefined) {
    insertValues.lastSeenAt = values.lastSeenAt;
  }
  if (values.lastSeenAtSlot !== undefined) {
    insertValues.lastSeenAtSlot = values.lastSeenAtSlot;
  }
  
  await tx.insert(table).values({
    attester: attester,
    ...insertValues
  }).onConflictDoUpdate({
    target: table.attester,
    set: insertValues,
    setWhere: sql`excluded.total IS DISTINCT FROM ${table.total}`
  })
}

async function _store(
  toStore: SentinelValidatorStats,
): Promise<void> {
  const {
    attester,
    history,
    attestations,
    blocks,
    lastSeenAt,
    lastSeenAtSlot,
    totalSlots,
  } = toStore;


  await db().transaction(async (tx) => {
    const insertValues: Omit<SentinelValidatorStats, "history" | "blocks" | "attestations" > = {
      attester,
      totalSlots,
    };

    if (lastSeenAt !== undefined) {
      insertValues.lastSeenAt = lastSeenAt;
    }
    if (lastSeenAtSlot !== undefined) {
      insertValues.lastSeenAtSlot = lastSeenAtSlot;
    }
    await tx.insert(SentinelValidatorTable)
    .values(insertValues)
    .onConflictDoUpdate({
      target: SentinelValidatorTable.attester,
      set: insertValues,
      setWhere: sql`excluded.last_seen_at IS DISTINCT FROM ${SentinelValidatorTable.lastSeenAt}`
    })

    await _insertOrUpdateCounterTable(tx, SentinelBlockTable, attester, blocks)
    await _insertOrUpdateCounterTable(tx, SentinelAttestationTable, attester, attestations)

    if(history && history.length > 0){
      history.forEach(async entry => {
        await _storeHistoryEntry(tx, attester, entry)
      })
    }
  });
}

export async function storeSentinelValidator(
  validator: SentinelValidatorStats,
): Promise<void> {
  await _store(validator);
}

export async function storeSentinelValidatorHistoryEntry(
  attester: string,
  entry: SentinelHistory
): Promise<void> {
  await db().transaction(async (tx) => {
    await _storeHistoryEntry(tx, attester, entry);
  });
}
