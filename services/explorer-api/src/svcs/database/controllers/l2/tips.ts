import { L2TipsEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2Block,
  ChicmozL2NativeBlockStatus,
  ChicmozL2Tips,
  L2NetworkId,
  chicmozL2TipsSchema,
} from "@chicmoz-pkg/types";
import { and, eq, isNull } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import { l2TipsTable, StoredL2Tips } from "../../schema/l2/tips.js";
import { l2Block } from "../../schema/l2block/index.js";

type TipBucket = "finalized" | "proven" | "checkpointed" | "proposed";

const toStoredTips = (row: typeof l2TipsTable.$inferSelect): StoredL2Tips => ({
  proposed: { number: row.proposedBlockNumber, hash: row.proposedBlockHash },
  proposedCheckpoint:
    row.proposedCheckpointBlockNumber !== null &&
    row.proposedCheckpointBlockHash !== null &&
    row.proposedCheckpointNumber !== null &&
    row.proposedCheckpointHash !== null
      ? {
          block: {
            number: row.proposedCheckpointBlockNumber,
            hash: row.proposedCheckpointBlockHash,
          },
          checkpoint: {
            number: row.proposedCheckpointNumber,
            hash: row.proposedCheckpointHash,
          },
        }
      : undefined,
  checkpointed: {
    block: { number: row.checkpointedBlockNumber, hash: row.checkpointedBlockHash },
    checkpoint: {
      number: row.checkpointedCheckpointNumber,
      hash: row.checkpointedCheckpointHash,
    },
  },
  proven: {
    block: { number: row.provenBlockNumber, hash: row.provenBlockHash },
    checkpoint: { number: row.provenCheckpointNumber, hash: row.provenCheckpointHash },
  },
  finalized: {
    block: { number: row.finalizedBlockNumber, hash: row.finalizedBlockHash },
    checkpoint: {
      number: row.finalizedCheckpointNumber,
      hash: row.finalizedCheckpointHash,
    },
  },
  observedAt: row.observedAt,
  source: {
    rpcNodeName: row.aztecNodeName ?? undefined,
    aztecNodeVersion: row.aztecNodeVersion ?? undefined,
  },
  degradedReason: row.degradedReason ?? undefined,
});

const flattenTips = (
  { tips, observedAt, source }: L2TipsEvent,
  degradedReason: string | null,
) => ({
  l2NetworkId: L2_NETWORK_ID,
  proposedBlockNumber: tips.proposed.number,
  proposedBlockHash: tips.proposed.hash,
  proposedCheckpointBlockNumber: tips.proposedCheckpoint?.block.number,
  proposedCheckpointBlockHash: tips.proposedCheckpoint?.block.hash,
  proposedCheckpointNumber: tips.proposedCheckpoint?.checkpoint.number,
  proposedCheckpointHash: tips.proposedCheckpoint?.checkpoint.hash,
  checkpointedBlockNumber: tips.checkpointed.block.number,
  checkpointedBlockHash: tips.checkpointed.block.hash,
  checkpointedCheckpointNumber: tips.checkpointed.checkpoint.number,
  checkpointedCheckpointHash: tips.checkpointed.checkpoint.hash,
  provenBlockNumber: tips.proven.block.number,
  provenBlockHash: tips.proven.block.hash,
  provenCheckpointNumber: tips.proven.checkpoint.number,
  provenCheckpointHash: tips.proven.checkpoint.hash,
  finalizedBlockNumber: tips.finalized.block.number,
  finalizedBlockHash: tips.finalized.block.hash,
  finalizedCheckpointNumber: tips.finalized.checkpoint.number,
  finalizedCheckpointHash: tips.finalized.checkpoint.hash,
  observedAt,
  aztecNodeName: source.rpcNodeName,
  aztecNodeVersion: source.aztecNodeVersion,
  degradedReason,
  updatedAt: new Date(),
});

const getBoundaryBlock = async (height: number) => {
  const rows = await db()
    .select({ hash: l2Block.hash })
    .from(l2Block)
    .where(and(eq(l2Block.height, BigInt(height)), isNull(l2Block.orphan_timestamp)))
    .limit(1);
  return rows[0]?.hash;
};

const validateBoundary = async (
  bucket: TipBucket,
  tips: ChicmozL2Tips,
): Promise<string | null> => {
  const tip = bucket === "proposed" ? tips.proposed : tips[bucket].block;
  const boundaryHash = await getBoundaryBlock(tip.number);
  if (!boundaryHash) {
    return `${bucket} boundary block ${tip.number} is missing`;
  }
  if (boundaryHash !== tip.hash) {
    return `${bucket} boundary block ${tip.number} hash mismatch: db=${boundaryHash} tip=${tip.hash}`;
  }
  return null;
};

export const upsertTips = async (event: L2TipsEvent) => {
  const tips = chicmozL2TipsSchema.parse(event.tips);
  let degradedReason: string | null = null;
  for (const bucket of ["finalized", "proven", "checkpointed", "proposed"] as const) {
    degradedReason = await validateBoundary(bucket, tips);
    if (degradedReason) {
      logger.warn(`L2 tips degraded: ${degradedReason}`);
      break;
    }
  }

  const values = flattenTips({ ...event, tips }, degradedReason);
  await db()
    .insert(l2TipsTable)
    .values(values)
    .onConflictDoUpdate({
      target: l2TipsTable.l2NetworkId,
      set: values,
    });
};

export const getTips = async (
  l2NetworkId: L2NetworkId = L2_NETWORK_ID,
): Promise<StoredL2Tips | null> => {
  const rows = await db()
    .select()
    .from(l2TipsTable)
    .where(eq(l2TipsTable.l2NetworkId, l2NetworkId))
    .limit(1);
  return rows[0] ? toStoredTips(rows[0]) : null;
};

export const deriveNativeStatus = (
  block: Pick<ChicmozL2Block, "height" | "hash" | "orphan">,
  storedTips: StoredL2Tips | null,
): ChicmozL2NativeBlockStatus => {
  if (!storedTips) {
    return "unknown";
  }
  if (storedTips.degradedReason) {
    return "unknown";
  }
  if (block.orphan) {
    return "unknown";
  }

  const height = Number(block.height);
  if (!Number.isSafeInteger(height) || height > storedTips.proposed.number) {
    return "unknown";
  }
  if (height <= storedTips.finalized.block.number) {
    return "finalized";
  }
  if (height <= storedTips.proven.block.number) {
    return "proven";
  }
  if (height <= storedTips.checkpointed.block.number) {
    return "checkpointed";
  }
  if (height <= storedTips.proposed.number) {
    return "proposed";
  }
  return "unknown";
};
