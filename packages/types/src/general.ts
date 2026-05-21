import { z } from "zod";
import {
  type ChicmozL2Block,
  type ChicmozL2BlockFinalizationStatus,
  type ChicmozL2Tips,
} from "./aztec/l2Block.js";
import { type ChicmozL2PendingTx } from "./aztec/l2TxEffect.js";
import { frSchema } from "./aztec/utils.js";

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

export type StringableChicmozL2Block = Omit<ChicmozL2Block, "header"> & {
  header: Omit<ChicmozL2Block["header"], "totalFees"> & {
    totalFees: string;
  };
};

export type WebsocketL2BlockFinalizationUpdate = {
  l2BlockHash: ChicmozL2Block["hash"];
  status: ChicmozL2BlockFinalizationStatus;
};

export type WebsocketUpdateMessageSender = {
  block?: StringableChicmozL2Block;
  txs?: ChicmozL2PendingTx[];
  finalizationUpdate?: WebsocketL2BlockFinalizationUpdate;
  l2Tips?: ChicmozL2Tips;
};

export type WebsocketUpdateMessageReceiver = {
  block?: ChicmozL2Block;
  txs?: ChicmozL2PendingTx[];
  finalizationUpdate?: WebsocketL2BlockFinalizationUpdate;
  l2Tips?: ChicmozL2Tips;
};
