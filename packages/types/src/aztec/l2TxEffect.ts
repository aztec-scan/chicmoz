import { z } from "zod";
import { aztecAddressSchema, hexStringSchema } from "../general.js";
import { frDecimalStringSchema, frSchema } from "./utils.js";

export const callTypeSchema = z.enum([
  "non_revertible",
  "revertible",
  "teardown",
]);

export const publicCallRequestSchema = z.object({
  msgSender: aztecAddressSchema,
  contractAddress: aztecAddressSchema,
  isStaticCall: z.boolean(),
  calldataHash: hexStringSchema,
  callType: callTypeSchema,
});

export const chicmozL2PendingTxSchema = z.object({
  txHash: z.lazy(() => chicmozL2TxEffectSchema.shape.txHash),
  feePayer: aztecAddressSchema,
  birthTimestamp: z.coerce.number().default(() => new Date().getTime()),
  // Expiration
  expirationTimestamp: z.coerce.number().optional(),
  // Gas limits
  gasLimitDa: z.coerce.number().optional(),
  gasLimitL2: z.coerce.number().optional(),
  teardownGasLimitDa: z.coerce.number().optional(),
  teardownGasLimitL2: z.coerce.number().optional(),
  // Max fees (stored as strings to preserve bigint precision)
  maxFeePerDaGas: z.string().optional(),
  maxFeePerL2Gas: z.string().optional(),
  maxPriorityFeePerDaGas: z.string().optional(),
  maxPriorityFeePerL2Gas: z.string().optional(),
  // Gas used in private phase
  gasUsedDa: z.coerce.number().optional(),
  gasUsedL2: z.coerce.number().optional(),
  // Fee payment method
  feePaymentMethod: z.string().optional(),
  // Summary counts (raw values are private/large, counts are useful)
  noteHashCount: z.coerce.number().optional(),
  nullifierCount: z.coerce.number().optional(),
  l2ToL1MsgCount: z.coerce.number().optional(),
  privateLogCount: z.coerce.number().optional(),
  // Public call requests (with callType tagging)
  publicCallRequests: z.array(publicCallRequestSchema).optional(),
});

export const chicmozL2DroppedTxSchema = z.object({
  txHash: z.lazy(() => chicmozL2TxEffectSchema.shape.txHash),
  createdAsPendingAt: z.coerce.number(),
  droppedAt: z.coerce.number().default(() => new Date().getTime()),
});

export const chicmozL2TxEffectSchema = z.object({
  revertCode: z.preprocess(
    (val) => {
      if (typeof val === "number") {
        return { code: val };
      }
      return val;
    },
    z.object({ code: z.number() }),
  ),
  txHash: hexStringSchema,
  txBirthTimestamp: z.coerce.number().optional(),
  transactionFee: frDecimalStringSchema,
  noteHashes: z.array(frSchema),
  nullifiers: z.array(frSchema),
  l2ToL1Msgs: z.array(frSchema),
  publicDataWrites: z.array(z.object({ leafSlot: frSchema, value: frSchema })),
  privateLogs: z.array(
    z.object({
      fields: z.array(frSchema),
      emittedLength: z.number(),
    }),
  ),
  publicLogs: z.array(
    z.object({
      contractAddress: aztecAddressSchema,
      fields: z.array(frSchema),
    }),
  ),
  contractClassLogs: z.array(
    z.object({
      contractAddress: aztecAddressSchema,
      fields: z.array(frSchema),
      emittedLength: z.number(),
    }),
  ),
});

export type CallType = z.infer<typeof callTypeSchema>;
export type PublicCallRequest = z.infer<typeof publicCallRequestSchema>;
export type ChicmozL2PendingTx = z.infer<typeof chicmozL2PendingTxSchema>;
export type ChicmozL2TxEffect = z.infer<typeof chicmozL2TxEffectSchema>;
export type ChicmozL2DroppedTx = z.infer<typeof chicmozL2DroppedTxSchema>;
