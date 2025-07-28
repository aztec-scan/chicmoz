import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { droppedTx } from "../dropped-tx/index.js";
import { generateTimestampColumn } from "../utils.js";

export const l2Tx = pgTable("tx", {
  txHash: varchar("hash").notNull().$type<HexString>().primaryKey(),
  feePayer: generateAztecAddressColumn("fee_payer").notNull(),
  birthTimestamp: generateTimestampColumn("birth_timestamp").notNull(),
});

export const l2TxRelations = relations(l2Tx, ({ one }) => ({
  droppedTx: one(droppedTx, {
    fields: [l2Tx.txHash],
    references: [droppedTx.txHash],
  }),
}));
