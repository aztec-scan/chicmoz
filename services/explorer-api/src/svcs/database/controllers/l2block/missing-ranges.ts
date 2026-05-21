import { L2BlockRangeRequestEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, asc, gte, isNull, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { logger } from "../../../../logger.js";
import { l2Block } from "../../schema/l2block/index.js";
import { getTips } from "../l2/tips.js";
import { getLatestHeight } from "./get-latest.js";

const STARTUP_SCAN_WINDOW = 10_000;
const STARTUP_MAX_BLOCKS = 500;

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

export const buildStartupMissingBlockRangeRequest = async (): Promise<
  L2BlockRangeRequestEvent | null
> => {
  const tips = await getTips();
  const latestHeight = await getLatestHeight();
  const upperBound = tips?.proposed.number ?? (latestHeight ? Number(latestHeight) : 0);
  if (!Number.isSafeInteger(upperBound) || upperBound < 1) {
    logger.info("Skipping startup L2 block reconciliation: no upper bound");
    return null;
  }

  const from = Math.max(1, upperBound - STARTUP_SCAN_WINDOW + 1);
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
  for (let height = from; height <= upperBound && missing.length < STARTUP_MAX_BLOCKS; height++) {
    if (!existing.has(height)) {
      missing.push(height);
    }
  }

  if (missing.length === 0) {
    logger.info("Startup L2 block reconciliation found no missing blocks");
    return null;
  }

  return {
    requestId: randomUUID(),
    requestedAt: Date.now(),
    reason: "startup",
    ranges: rangesFromHeights(missing),
    maxBlocks: STARTUP_MAX_BLOCKS,
  };
};
