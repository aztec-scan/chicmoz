import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";
import { l2Tx } from "../l2tx/index.js";

export const l2TxL2ToL1Msg = pgTable(
  "tx_l2_to_l1_msg",
  {
    txHash: varchar("tx_hash").notNull().$type<HexString>(),
    index: integer("index").notNull(),
    contractAddress: generateAztecAddressColumn("contract_address").notNull(),
    // Ethereum address of the L1 recipient
    recipient: varchar("recipient", { length: 42 }).notNull(),
    // Fr field element serialized as decimal string
    content: varchar("content").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.txHash, table.index] }),
  }),
);

export const l2TxL2ToL1MsgRelations = relations(l2TxL2ToL1Msg, ({ one }) => ({
  tx: one(l2Tx, {
    fields: [l2TxL2ToL1Msg.txHash],
    references: [l2Tx.txHash],
  }),
}));
