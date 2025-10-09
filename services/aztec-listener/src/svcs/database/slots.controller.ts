import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { eq, getTableColumns } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../environment.js";
import { slotsTable } from "./schema.js";

export async function storeLastProcessedSlot(slot: bigint) {
  await db()
    .update(slotsTable)
    .set({ lastProcessedSlot: slot })
    .where(eq(slotsTable.networkId, L2_NETWORK_ID));
}


export async function ensureInitializedSlots() {
  await db()
    .insert(slotsTable)
    .values({
      networkId: L2_NETWORK_ID,
      lastProcessedSlot: 0n,
    })
    .onConflictDoNothing();
}

export async function getLastProcessedSlot() {
  const result = await db()
    .select(getTableColumns(slotsTable))
    .from(slotsTable)
    .where(eq(slotsTable.networkId, L2_NETWORK_ID))
    .limit(1);
  if (result.length === 0) {throw new Error("FATAL: slots not initialized");}
  return result[0].lastProcessedSlot;
}
