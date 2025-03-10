import { z } from "zod";
import {
  aztecAddressSchema,
  ethAddressSchema,
  hexStringSchema,
} from "../general.js";
import { chicmozL1L2BlockProposedSchema, chicmozL1L2ProofVerifiedSchema } from "../index.js";
import { deepPartial } from "../utils.js";
import { chicmozL2TxEffectSchema } from "./l2TxEffect.js";
import {
  bufferSchema,
  frNumberSchema,
  frSchema,
  frTimestampSchema,
} from "./utils.js";

export enum ChicmozL2BlockFinalizationStatus {
  L2_NODE_SEEN_PROPOSED = 0,
  L2_NODE_SEEN_PROVEN = 1,
  L1_SEEN_PROPOSED = 2,
  L1_SEEN_PROVEN = 3,
  L1_MINED_PROPOSED = 4,
  L1_MINED_PROVEN = 5,
}

export const FIRST_FINALIZATION_STATUS =
  ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED;

export const LAST_FINALIZATION_STATUS =
  ChicmozL2BlockFinalizationStatus.L1_MINED_PROVEN;

export const chicmozL2BlockFinalizationStatusSchema = z
  .nativeEnum(ChicmozL2BlockFinalizationStatus)
  .default(0);

export const chicmozL2BlockSchema = z.object({
  hash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  finalizationStatus: chicmozL2BlockFinalizationStatusSchema,
  proposedOnL1: z.lazy(() =>
    chicmozL1L2BlockProposedSchema.omit({ l2BlockNumber: true }).optional()
  ),
  proofVerifiedOnL1: z.lazy(() =>
    chicmozL1L2ProofVerifiedSchema.omit({ l2BlockNumber: true }).optional()
  ),
  archive: z.object({
    root: frSchema,
    nextAvailableLeafIndex: z.number(),
  }),
  header: z.object({
    lastArchive: z.object({
      root: frSchema,
      nextAvailableLeafIndex: z.number(),
    }),
    contentCommitment: z.object({
      numTxs: frNumberSchema,
      blobsHash: bufferSchema,
      inHash: bufferSchema,
      outHash: bufferSchema,
    }),
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
      chainId: frNumberSchema,
      version: frNumberSchema,
      blockNumber: frNumberSchema,
      slotNumber: frNumberSchema,
      timestamp: frTimestampSchema,
      coinbase: ethAddressSchema,
      feeRecipient: aztecAddressSchema,
      gasFees: z.object({
        feePerDaGas: frNumberSchema,
        feePerL2Gas: frNumberSchema,
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
