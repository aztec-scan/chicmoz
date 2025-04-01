import { z } from "zod";
import { aztecAddressSchema, hexStringSchema } from "../general.js";
import { frNumberSchema, frSchema } from "./utils.js";


export const chicmozL2PendingTxSchema = z.object({
  // TODO: this schema needs to be properly defined, perhaps merged with txEffect
  hash: hexStringSchema,
  birthTimestamp: z.number(),
});

/**
 * Represents effects of a transaction on the L2 state.
 */
export const chicmozL2TxEffectSchema = z.object({
  revertCode: z.preprocess(
    (val) => {
      if (typeof val === "number") {
        return { code: val };
      }
      return val;
    },
    z.object({ code: z.number() })
  ),
  txHash: hexStringSchema,
  txBirthTimestamp: z.number().optional(),
  transactionFee: frNumberSchema,
  noteHashes: z.array(frSchema),
  nullifiers: z.array(frSchema),
  l2ToL1Msgs: z.array(frSchema),
  publicDataWrites: z.array(z.object({ leafSlot: frSchema, value: frSchema })),
  privateLogs: z.array(frSchema),
  publicLogs: z.array(frSchema),
  contractClassLogs: z.array(z.object({ contractAddress: aztecAddressSchema, fields: z.array(frSchema) })),
  contractClassLogsLength: frNumberSchema,
});

export type ChicmozL2PendingTx = z.infer<typeof chicmozL2PendingTxSchema>;
export type ChicmozL2TxEffect = z.infer<typeof chicmozL2TxEffectSchema>;
