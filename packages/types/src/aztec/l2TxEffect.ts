import { z } from "zod";
import { aztecAddressSchema, hexStringSchema } from "../general.js";
import { frNumberSchema, frSchema } from "./utils.js";

export const publicCallRequestSchema = z.object({
  msgSender: aztecAddressSchema,
  contractAddress: aztecAddressSchema,
  isStaticCall: z.boolean(),
  calldataHash: hexStringSchema,
});

export const chicmozL2PendingTxSchema = z.object({
  txHash: z.lazy(() => chicmozL2TxEffectSchema.shape.txHash),
  feePayer: aztecAddressSchema,
  birthTimestamp: z.coerce.date().default(() => new Date()),
  publicCallRequests: z.array(publicCallRequestSchema).optional(),
});

export const chicmozL2DroppedTxSchema = z.object({
  txHash: z.lazy(() => chicmozL2TxEffectSchema.shape.txHash),
  createdAsPendingAt: z.coerce.date(),
  droppedAt: z.coerce.date().default(() => new Date()),
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
  txBirthTimestamp: z.coerce.date().optional(),
  transactionFee: frNumberSchema,
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
      emittedLength: z.number(),
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

export type PublicCallRequest = z.infer<typeof publicCallRequestSchema>;
export type ChicmozL2PendingTx = z.infer<typeof chicmozL2PendingTxSchema>;
export type ChicmozL2TxEffect = z.infer<typeof chicmozL2TxEffectSchema>;
export type ChicmozL2DroppedTx = z.infer<typeof chicmozL2DroppedTxSchema>;
