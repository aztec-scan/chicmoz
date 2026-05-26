import { z } from "zod";
import {
  aztecAddressSchema,
  ethAddressSchema,
  hexStringSchema,
} from "../general.js";
import {
  chicmozL1L2BlockProposedSchema,
  chicmozL1L2ProofVerifiedSchema,
} from "../index.js";
import { deepPartial } from "../utils.js";
import { chicmozL2TxEffectSchema } from "./l2TxEffect.js";
import {
  frDecimalStringSchema,
  frSchema,
  frSmallIntSchema,
  frTimestampSchema,
} from "./utils.js";

export const chicmozL2NativeBlockStatusSchema = z.enum([
  "proposed",
  "checkpointed",
  "proven",
  "finalized",
  "unknown",
]).describe(
  "Aztec-native block display status derived from current L2 tips. On Aztec v4, finalized may equal proven upstream.",
);

export type ChicmozL2NativeBlockStatus = z.infer<
  typeof chicmozL2NativeBlockStatusSchema
>;

export const chicmozL2TipBlockSchema = z.object({
  number: z.coerce.number().int().nonnegative(),
  hash: hexStringSchema,
});

export type ChicmozL2TipBlock = z.infer<typeof chicmozL2TipBlockSchema>;

export const chicmozL2CheckpointRefSchema = z.object({
  number: z.coerce.number().int().nonnegative(),
  hash: hexStringSchema,
});

export const chicmozL2CheckpointTipSchema = z.object({
  block: chicmozL2TipBlockSchema,
  checkpoint: chicmozL2CheckpointRefSchema,
});

export type ChicmozL2CheckpointTip = z.infer<
  typeof chicmozL2CheckpointTipSchema
>;

export const chicmozL2TipsSchema = z.object({
  proposed: chicmozL2TipBlockSchema,
  proposedCheckpoint: chicmozL2CheckpointTipSchema.optional(),
  checkpointed: chicmozL2CheckpointTipSchema,
  proven: chicmozL2CheckpointTipSchema,
  finalized: chicmozL2CheckpointTipSchema,
});

export type ChicmozL2Tips = z.infer<typeof chicmozL2TipsSchema>;

export const chicmozL2TipsHealthSchema = z.object({
  tips: chicmozL2TipsSchema,
  observedAt: z.coerce.number().int().nonnegative(),
  stale: z.boolean(),
  stalenessMs: z.coerce.number().int().nonnegative(),
  staleAfterMs: z.coerce.number().int().positive(),
  degraded: z.boolean(),
  degradedReason: z.string().optional(),
  repeatedDegradedBoundaryMismatch: z
    .object({
      bucket: z.enum(["finalized", "proven", "checkpointed", "proposed"]),
      height: z.coerce.number().int().nonnegative(),
      expectedHash: hexStringSchema,
      observedDbHash: hexStringSchema.optional(),
      firstSeenAt: z.coerce.string(),
      lastSeenAt: z.coerce.string(),
      occurrenceCount: z.coerce.number().int().positive(),
      reason: z.string(),
    })
    .optional(),
  source: z.object({
    rpcNodeName: z.string().optional(),
    aztecNodeVersion: z.string().optional(),
  }),
});

export type ChicmozL2TipsHealth = z.infer<typeof chicmozL2TipsHealthSchema>;

export const chicmozL2BlockSchema = z.object({
  hash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  nativeStatus: chicmozL2NativeBlockStatusSchema.optional(),
  proposedOnL1: z.lazy(() =>
    chicmozL1L2BlockProposedSchema.omit({ l2BlockNumber: true }).optional(),
  ),
  proofVerifiedOnL1: z.lazy(() =>
    chicmozL1L2ProofVerifiedSchema.omit({ l2BlockNumber: true }).optional(),
  ),
  orphan: z
    .object({
      timestamp: z.coerce.number(),
      hasOrphanedParent: z.boolean(),
    })
    .optional(),
  archive: z.object({
    root: frSchema,
    nextAvailableLeafIndex: z.number(),
  }),
  header: z.object({
    lastArchive: z.object({
      root: frSchema,
      nextAvailableLeafIndex: z.number(),
    }),
    spongeBlobHash: frSchema,
    state: z.object({
      l1ToL2MessageTree: z.object({
        root: frSchema,
        nextAvailableLeafIndex: z.number(),
      }),
      partial: z.object({
        noteHashTree: z.object({
          root: frSchema,
          nextAvailableLeafIndex: z.number(),
        }),
        nullifierTree: z.object({
          root: frSchema,
          nextAvailableLeafIndex: z.number(),
        }),
        publicDataTree: z.object({
          root: frSchema,
          nextAvailableLeafIndex: z.number(),
        }),
      }),
    }),
    globalVariables: z.object({
      chainId: frSmallIntSchema,
      version: frSmallIntSchema,
      blockNumber: frSmallIntSchema,
      slotNumber: frSmallIntSchema,
      timestamp: frTimestampSchema,
      coinbase: ethAddressSchema,
      feeRecipient: aztecAddressSchema,
      gasFees: z.object({
        feePerDaGas: frDecimalStringSchema,
        feePerL2Gas: frDecimalStringSchema,
      }),
    }),
    totalFees: z.coerce.bigint(),
    totalManaUsed: z.coerce.bigint(),
  }),
  body: z.object({
    txEffects: z.array(chicmozL2TxEffectSchema),
  }),
});

export type ChicmozL2Block = z.infer<typeof chicmozL2BlockSchema>;

// NOTE: for testing purposes only
export const partialChicmozL2BlockSchema = deepPartial(chicmozL2BlockSchema);
