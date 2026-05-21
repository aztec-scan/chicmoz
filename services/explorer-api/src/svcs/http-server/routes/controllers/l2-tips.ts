import { type ChicmozL2TipsHealth } from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { L2_TIPS_STALE_AFTER_MS } from "../../../../environment.js";
import { controllers as db } from "../../../database/index.js";
import { l2TipsHealthResponse } from "./utils/index.js";

export const openapi_GET_L2_TIPS: OpenAPIObject["paths"] = {
  "/l2/tips": {
    get: {
      tags: ["l2-chain"],
      summary: "Get latest Aztec native L2 tips and health state",
      description:
        "Returns the latest L2 tip snapshot observed from AztecNode.getL2Tips(). " +
        "`nativeStatus` is the product-facing block-display status derived from these tips. " +
        "On Aztec v4, upstream `finalized` may currently equal `proven`. " +
        "`checkpointed` means the block is at or below the latest checkpointed tip; `unknown` means tips are missing, stale/degraded, orphaned, or the block is above the proposed tip.",
      responses: l2TipsHealthResponse,
    },
  },
};

const buildTipsHealth = (
  tips: NonNullable<Awaited<ReturnType<typeof db.l2.tips.getTips>>>,
  mismatches: Awaited<ReturnType<typeof db.l2.tips.getRecentBoundaryMismatches>>,
): ChicmozL2TipsHealth => {
  const stalenessMs = Math.max(0, Date.now() - tips.observedAt);
  const degraded = tips.degradedReason !== undefined;
  const repeatedMismatch = mismatches.find(
    (mismatch) => mismatch.occurrenceCount > 1 && !mismatch.resolvedAt,
  );
  return {
    tips: {
      proposed: tips.proposed,
      proposedCheckpoint: tips.proposedCheckpoint,
      checkpointed: tips.checkpointed,
      proven: tips.proven,
      finalized: tips.finalized,
    },
    observedAt: tips.observedAt,
    stale: stalenessMs >= L2_TIPS_STALE_AFTER_MS,
    stalenessMs,
    staleAfterMs: L2_TIPS_STALE_AFTER_MS,
    degraded,
    degradedReason: tips.degradedReason,
    repeatedDegradedBoundaryMismatch: repeatedMismatch
      ? {
          bucket: repeatedMismatch.bucket,
          height: repeatedMismatch.height,
          expectedHash: repeatedMismatch.expectedHash,
          observedDbHash: repeatedMismatch.observedDbHash ?? undefined,
          firstSeenAt: repeatedMismatch.firstSeenAt.toISOString(),
          lastSeenAt: repeatedMismatch.lastSeenAt.toISOString(),
          occurrenceCount: repeatedMismatch.occurrenceCount,
          reason: repeatedMismatch.reason,
        }
      : undefined,
    source: tips.source,
  };
};

export const GET_L2_TIPS = asyncHandler(async (_req, res) => {
  const tips = await db.l2.tips.getTips();
  if (!tips) {
    res.status(404).send("L2 tips not found");
    return;
  }
  const mismatches = await db.l2.tips.getRecentBoundaryMismatches();
  res.status(200).json(buildTipsHealth(tips, mismatches));
});
