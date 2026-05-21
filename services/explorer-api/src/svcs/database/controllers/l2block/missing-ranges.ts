import {
  L2BlockRangeRequestEvent,
  L2BlockRangeRequestReason,
} from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, asc, gte, isNull, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  L2_BLOCK_RECONCILIATION_MAX_BLOCKS,
  L2_BLOCK_RECONCILIATION_SCAN_WINDOW,
  L2_BLOCK_RECONCILIATION_TIP_REPAIR_WINDOW,
} from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import { l2Block } from "../../schema/l2block/index.js";
import { getTips } from "../l2/tips.js";
import { getLatestHeight } from "./get-latest.js";

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

export const findMissingHeightsInWindow = async ({
  from,
  upperBound,
}: {
  from: number;
  upperBound: number;
}) => {
  const existingRows = await db()
    .select({ height: l2Block.height })
    .from(l2Block)
    .where(
      and(
        gte(l2Block.height, BigInt(from)),
        lte(l2Block.height, BigInt(upperBound)),
        isNull(l2Block.orphan_timestamp),
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

  if (missing.length === 0) {
    logger.info(`${reason} L2 block reconciliation found no missing blocks`);
    return null;
  }

  const ranges = rangesFromHeights(missing);
  logger.info(
    `${reason} L2 block reconciliation requesting ${missing.length} missing blocks in ${ranges.length} ranges from ${from} to ${upperBound}; remainingOpenGaps=${Math.max(0, allMissing.length - missing.length)}`,
  );

  return {
    requestId: randomUUID(),
    requestedAt: Date.now(),
    reason,
    ranges,
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
