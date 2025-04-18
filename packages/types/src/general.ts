import { z } from "zod";
import { frSchema } from "./aztec/utils.js";
import {
  ChicmozL2Block,
  ChicmozL2PendingTx,
  chicmozL2BlockSchema,
} from "./index.js";

export const hexStringSchema = z.custom<`0x${string}`>(
  (value) => {
    return (
      typeof value === "string" && value.match(/^0x[0-9a-fA-F]+$/) !== null
    );
  },
  { message: "Expected a hex string" },
);

export type HexString = z.infer<typeof hexStringSchema>;

export const ethAddressSchema = z
  .string()
  .length(42)
  .regex(/^0x[0-9a-fA-F]+$/);
export type EthAddress = z.infer<typeof ethAddressSchema>;

// NOTE: it's technically not the same as Fr but practically it is
export const aztecAddressSchema = frSchema;

export type AztecAddress = z.infer<typeof aztecAddressSchema>;

const stringableChicmozL2BlockSchema = z.lazy(() => {
  return z.object({
    ...chicmozL2BlockSchema.shape,
    header: z.object({
      ...chicmozL2BlockSchema.shape.header.shape,
      totalFees: z.string(),
    }),
  });
});

export type StringableChicmozL2Block = z.infer<
  typeof stringableChicmozL2BlockSchema
>;

export type WebsocketUpdateMessageSender = {
  block?: StringableChicmozL2Block;
  txs?: ChicmozL2PendingTx[];
};

export type WebsocketUpdateMessageReceiver = {
  block?: ChicmozL2Block;
  txs?: ChicmozL2PendingTx[];
};
