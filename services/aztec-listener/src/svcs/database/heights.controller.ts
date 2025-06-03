import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { eq, getTableColumns } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../environment.js";
import { heightsTable } from "./schema.js";

export async function storeProcessedProposedBlockHeight(height: number) {
  await db()
    .update(heightsTable)
    .set({ processedProposedBlockHeight: height })
    .where(eq(heightsTable.networkId, L2_NETWORK_ID));
}

export async function storeProcessedProvenBlockHeight(height: number) {
  await db()
    .update(heightsTable)
    .set({ processedProvenBlockHeight: height })
    .where(eq(heightsTable.networkId, L2_NETWORK_ID));
}

export async function storeChainProposedBlockHeight(height: number) {
  await db()
    .update(heightsTable)
    .set({ chainProposedBlockHeight: height })
    .where(eq(heightsTable.networkId, L2_NETWORK_ID));
}

export async function storeChainProvenBlockHeight(height: number) {
  await db()
    .update(heightsTable)
    .set({ chainProvenBlockHeight: height })
    .where(eq(heightsTable.networkId, L2_NETWORK_ID));
}

export async function storeBlockHeights({
  processedProposedBlockHeight,
  chainProposedBlockHeight,
  processedProvenBlockHeight,
  chainProvenBlockHeight,
}: {
  processedProposedBlockHeight: number;
  chainProposedBlockHeight: number;
  processedProvenBlockHeight: number;
  chainProvenBlockHeight: number;
}) {
  await db()
    .update(heightsTable)
    .set({
      processedProposedBlockHeight,
      chainProposedBlockHeight,
      processedProvenBlockHeight,
      chainProvenBlockHeight,
    })
    .where(eq(heightsTable.networkId, L2_NETWORK_ID));
}

export async function ensureInitializedBlockHeights() {
  await db()
    .insert(heightsTable)
    .values({
      networkId: L2_NETWORK_ID,
      processedProposedBlockHeight: 0,
      chainProposedBlockHeight: 0,
      processedProvenBlockHeight: 0,
      chainProvenBlockHeight: 0,
    })
    .onConflictDoNothing();
}

export async function getBlockHeights() {
  const result = await db()
    .select(getTableColumns(heightsTable))
    .from(heightsTable)
    .where(eq(heightsTable.networkId, L2_NETWORK_ID))
    .limit(1);
  if (!result) {throw new Error("FATAL: block heights not initialized");}
  return result[0];
}
