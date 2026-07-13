import {
  L2BlockRangeRequestEvent,
  L2BlockRangeRequestReason,
} from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  L2_BLOCK_RECONCILIATION_MAX_BLOCKS,
  L2_BLOCK_RECONCILIATION_SCAN_WINDOW,
  L2_BLOCK_RECONCILIATION_TIP_REPAIR_WINDOW,
  L2_NETWORK_ID,
} from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import { l2OpenGapTable } from "../../schema/l2/open-gap.js";
import { l2Block } from "../../schema/l2block/index.js";
import { getCurrentRollupVersionNumber } from "../l2/chain-info/rollup-version-cache.js";
import { getTips } from "../l2/tips.js";
import { getLatestBlockRollupVersion, getLatestHeight } from "./get-latest.js";

const rangesFromHeights = (missingHeights: number[]) => {
  const ranges: Array<{ from: number; to: number; statusHint: "proposed" }> = [];
  for (const height of missingHeights) {
    const last = ranges[ranges.length - 1];
    if (last && last.to + 1 === height) {
      last.to = height;
    } else {
      ranges.push({ from: height, to: height, statusHint: "proposed" });
    }
  }
  return ranges;
};

const gapId = ({
  from,
  to,
  reason,
}: {
  from: number;
  to: number;
  reason: L2BlockRangeRequestReason;
}) => `${L2_NETWORK_ID}:${reason}:${from}:${to}`;

const upsertOpenGaps = async ({
  ranges,
  reason,
}: {
  ranges: Array<{ from: number; to: number; statusHint: "proposed" }>;
  reason: L2BlockRangeRequestReason;
}) => {
  for (const range of ranges) {
    const values = {
      id: gapId({ ...range, reason }),
      l2NetworkId: L2_NETWORK_ID,
      fromHeight: range.from,
      toHeight: range.to,
      reason,
      statusHint: range.statusHint,
      status: "open" as const,
      lastSeenAt: new Date(),
      fulfilledAt: null,
      lastError: null,
    };

    await db()
      .insert(l2OpenGapTable)
      .values(values)
      .onConflictDoUpdate({
        target: l2OpenGapTable.id,
        set: {
          status: "open",
          lastSeenAt: values.lastSeenAt,
          statusHint: values.statusHint,
          fulfilledAt: null,
          lastError: null,
        },
      });
  }
};

const getOpenGaps = async (maxBlocks: number, chainTip: number) => {
  const rows = await db()
    .select()
    .from(l2OpenGapTable)
    .where(
      and(
        eq(l2OpenGapTable.l2NetworkId, L2_NETWORK_ID),
        eq(l2OpenGapTable.status, "open"),
        lte(l2OpenGapTable.fromHeight, chainTip),
      ),
    )
    .orderBy(asc(l2OpenGapTable.firstSeenAt))
    .limit(maxBlocks);

  const ranges: Array<{ from: number; to: number; statusHint: "proposed" }> = [];
  let remaining = maxBlocks;
  for (const row of rows) {
    const size = row.toHeight - row.fromHeight + 1;
    if (size <= remaining) {
      ranges.push({ from: row.fromHeight, to: row.toHeight, statusHint: row.statusHint });
      remaining -= size;
    } else if (remaining > 0) {
      ranges.push({
        from: row.fromHeight,
        to: row.fromHeight + remaining - 1,
        statusHint: row.statusHint,
      });
      remaining = 0;
    }
    if (remaining <= 0) {
      break;
    }
  }

  return ranges;
};

const markGapsRequested = async (
  ranges: Array<{ from: number; to: number; statusHint: "proposed" }>,
) => {
  for (const range of ranges) {
    await db()
      .update(l2OpenGapTable)
      .set({
        requestCount: sql`${l2OpenGapTable.requestCount} + 1`,
        lastRequestedAt: new Date(),
      })
      .where(
        and(
          eq(l2OpenGapTable.l2NetworkId, L2_NETWORK_ID),
          eq(l2OpenGapTable.status, "open"),
          lte(l2OpenGapTable.fromHeight, range.to),
          gte(l2OpenGapTable.toHeight, range.from),
        ),
      );
  }
};

const resolveReconciliationRollupVersion = async (): Promise<number | null> => {
  return (
    (await getCurrentRollupVersionNumber()) ??
    getLatestBlockRollupVersion()
  );
};

export const findMissingHeightsInWindow = async ({
  from,
  upperBound,
}: {
  from: number;
  upperBound: number;
}) => {
  const effectiveVersion = await resolveReconciliationRollupVersion();
  const versionFilter =
    effectiveVersion === null
      ? undefined
      : eq(l2Block.version, effectiveVersion);
  const existingRows = await db()
    .select({ height: l2Block.height })
    .from(l2Block)
    .where(
      and(
        gte(l2Block.height, BigInt(from)),
        lte(l2Block.height, BigInt(upperBound)),
        isNull(l2Block.orphan_timestamp),
        ...(versionFilter ? [versionFilter] : []),
      ),
    )
    .orderBy(asc(l2Block.height));

  const existing = new Set(existingRows.map((row) => Number(row.height)));
  const missing: number[] = [];
  for (let height = from; height <= upperBound; height++) {
    if (!existing.has(height)) {
      missing.push(height);
    }
  }
  return missing;
};

const getReconciliationUpperBound = async () => {
  const tips = await getTips();
  const latestHeight = await getLatestHeight();
  const upperBound = tips?.proposed.number ?? (latestHeight ? Number(latestHeight) : 0);
  return { tips, upperBound };
};

export const buildMissingBlockRangeRequest = async ({
  reason,
  scanWindow = L2_BLOCK_RECONCILIATION_SCAN_WINDOW,
  maxBlocks = L2_BLOCK_RECONCILIATION_MAX_BLOCKS,
}: {
  reason: Extract<L2BlockRangeRequestReason, "startup" | "cadence">;
  scanWindow?: number;
  maxBlocks?: number;
}): Promise<L2BlockRangeRequestEvent | null> => {
  const { upperBound } = await getReconciliationUpperBound();
  if (!Number.isSafeInteger(upperBound) || upperBound < 1) {
    logger.info(`Skipping ${reason} L2 block reconciliation: no upper bound`);
    return null;
  }

  const from = Math.max(1, upperBound - scanWindow + 1);
  const allMissing = await findMissingHeightsInWindow({ from, upperBound });
  const missing = allMissing.slice(0, maxBlocks);

  const ranges = rangesFromHeights(missing);
  if (ranges.length > 0) {
    await upsertOpenGaps({ ranges, reason });
  }

  const openGapRanges = await getOpenGaps(maxBlocks, upperBound);
  if (openGapRanges.length === 0) {
    logger.info(`${reason} L2 block reconciliation found no missing blocks`);
    return null;
  }
  const requestRanges = openGapRanges.length > 0 ? openGapRanges : ranges;
  await markGapsRequested(requestRanges);
  logger.info(
    `${reason} L2 block reconciliation requesting ${requestRanges.length} open-gap ranges from ${from} to ${upperBound}; newlyDiscoveredMissing=${missing.length}; remainingScanWindowMissing=${Math.max(0, allMissing.length - missing.length)}`,
  );

  return {
    requestId: randomUUID(),
    requestedAt: Date.now(),
    reason,
    ranges: requestRanges,
    maxBlocks,
  };
};

export const buildStartupMissingBlockRangeRequest = async () =>
  buildMissingBlockRangeRequest({ reason: "startup" });

const parseTipBoundaryHeight = (degradedReason: string | undefined) => {
  if (!degradedReason) {
    return null;
  }
  const match = /boundary block (\d+) (?:is missing|hash mismatch)/u.exec(degradedReason);
  if (!match?.[1]) {
    return null;
  }
  const height = Number(match[1]);
  return Number.isSafeInteger(height) && height > 0 ? height : null;
};

export const buildTipBoundaryRepairRequest = async (): Promise<L2BlockRangeRequestEvent | null> => {
  const tips = await getTips();
  const height = parseTipBoundaryHeight(tips?.degradedReason);
  if (!height) {
    return null;
  }
  const repairWindow = L2_BLOCK_RECONCILIATION_TIP_REPAIR_WINDOW;
  const from = Math.max(1, height - repairWindow);
  const to = height + repairWindow;
  await upsertOpenGaps({
    reason: "tip_boundary_mismatch",
    ranges: [{ from, to, statusHint: "proposed" }],
  });
  await markGapsRequested([{ from, to, statusHint: "proposed" }]);
  logger.warn(
    `Requesting L2 tip-boundary repair around block ${height}: ${from}-${to}; reason=${tips?.degradedReason}`,
  );
  return {
    requestId: randomUUID(),
    requestedAt: Date.now(),
    reason: "tip_boundary_mismatch",
    ranges: [{ from, to, statusHint: "proposed" }],
    maxBlocks: Math.min(L2_BLOCK_RECONCILIATION_MAX_BLOCKS, to - from + 1),
  };
};

export const markOpenGapsFulfilledByHeight = async (height: bigint) => {
  const candidateGaps = await db()
    .select()
    .from(l2OpenGapTable)
    .where(
      and(
        eq(l2OpenGapTable.l2NetworkId, L2_NETWORK_ID),
        eq(l2OpenGapTable.status, "open"),
        lte(l2OpenGapTable.fromHeight, Number(height)),
        gte(l2OpenGapTable.toHeight, Number(height)),
      ),
    );

  for (const gap of candidateGaps) {
    const missing = await findMissingHeightsInWindow({
      from: gap.fromHeight,
      upperBound: gap.toHeight,
    });
    if (missing.length === 0) {
      await db()
        .update(l2OpenGapTable)
        .set({ status: "fulfilled", fulfilledAt: new Date(), lastError: null })
        .where(eq(l2OpenGapTable.id, gap.id));
    }
  }
};
