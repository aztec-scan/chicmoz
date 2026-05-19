import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozChainInfo, type L2NetworkId } from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { logger } from "../../../../../logger.js";
import { l2RollupVersionObservationTable } from "../../../schema/l2/rollup-version-observation.js";

// TODO: This should maybe use Redis for caching instead of in-memory.

export type RollupVersionObservationSource =
  | "node-info"
  | "chain-info"
  | "block";

const currentRollupVersionByNetwork = new Map<
  L2NetworkId,
  ChicmozChainInfo["rollupVersion"]
>();

export async function observeRollupVersion({
  l2NetworkId,
  rollupVersion,
  source,
}: {
  l2NetworkId: L2NetworkId;
  rollupVersion: ChicmozChainInfo["rollupVersion"];
  source: RollupVersionObservationSource;
}): Promise<void> {
  const now = new Date();
  const rollupVersionText = rollupVersion.toString();

  await db()
    .insert(l2RollupVersionObservationTable)
    .values({
      l2NetworkId,
      rollupVersion: rollupVersionText,
      firstSeenAt: now,
      lastSeenAt: now,
      firstSeenSource: source,
      lastSeenSource: source,
    })
    .onConflictDoUpdate({
      target: [
        l2RollupVersionObservationTable.l2NetworkId,
        l2RollupVersionObservationTable.rollupVersion,
      ],
      set: {
        lastSeenAt: now,
        lastSeenSource: source,
      },
    });

  const current = await getCurrentRollupVersion(l2NetworkId, {
    bypassCache: true,
  });
  if (current !== null) {
    currentRollupVersionByNetwork.set(l2NetworkId, current);
  }
}

export async function getCurrentRollupVersion(
  l2NetworkId: L2NetworkId = L2_NETWORK_ID,
  options: { bypassCache?: boolean } = {},
): Promise<ChicmozChainInfo["rollupVersion"] | null> {
  if (!options.bypassCache) {
    const cached = currentRollupVersionByNetwork.get(l2NetworkId);
    if (cached !== undefined) {
      return cached;
    }
  }

  const result = await db()
    .select({ rollupVersion: l2RollupVersionObservationTable.rollupVersion })
    .from(l2RollupVersionObservationTable)
    .where(eq(l2RollupVersionObservationTable.l2NetworkId, l2NetworkId))
    .orderBy(desc(l2RollupVersionObservationTable.firstSeenAt))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const current = BigInt(result[0].rollupVersion);
  currentRollupVersionByNetwork.set(l2NetworkId, current);
  return current;
}

export async function getCurrentRollupVersionNumber(
  l2NetworkId: L2NetworkId = L2_NETWORK_ID,
): Promise<number | null> {
  const current = await getCurrentRollupVersion(l2NetworkId);
  return current === null ? null : Number(current);
}

export async function getRollupVersionSplit(
  l2NetworkId: L2NetworkId = L2_NETWORK_ID,
): Promise<
  Array<{
    rollupVersion: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
    firstSeenSource: string;
    lastSeenSource: string;
    isCurrent: boolean;
  }>
> {
  const currentRollupVersion = await getCurrentRollupVersion(l2NetworkId);
  const result = await db()
    .select({
      rollupVersion: l2RollupVersionObservationTable.rollupVersion,
      firstSeenAt: l2RollupVersionObservationTable.firstSeenAt,
      lastSeenAt: l2RollupVersionObservationTable.lastSeenAt,
      firstSeenSource: l2RollupVersionObservationTable.firstSeenSource,
      lastSeenSource: l2RollupVersionObservationTable.lastSeenSource,
    })
    .from(l2RollupVersionObservationTable)
    .where(eq(l2RollupVersionObservationTable.l2NetworkId, l2NetworkId))
    .orderBy(desc(l2RollupVersionObservationTable.firstSeenAt));

  return result.map((row) => ({
    rollupVersion: row.rollupVersion,
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    firstSeenSource: row.firstSeenSource,
    lastSeenSource: row.lastSeenSource,
    isCurrent: currentRollupVersion?.toString() === row.rollupVersion,
  }));
}

export async function initializeRollupVersionCache(): Promise<void> {
  try {
    const currentRollupVersion = await getCurrentRollupVersion(L2_NETWORK_ID, {
      bypassCache: true,
    });
    if (currentRollupVersion !== null) {
      logger.info(
        `Initialized current rollup version cache: ${currentRollupVersion.toString()}`,
      );
    }
  } catch (error) {
    logger.warn(
      `Rollup version cache initializing with no data: ${(error as Error).message}`,
    );
  }
}
