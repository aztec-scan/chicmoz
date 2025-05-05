import { HexString } from "@chicmoz-pkg/types";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { droppedTx } from "../dropped-tx/index.js";

export const l2Tx = pgTable("tx", {
  hash: varchar("hash").notNull().$type<HexString>().primaryKey(),
  birthTimestamp: timestamp("birth_timestamp").notNull().defaultNow(),
});

export const l2TxRelations = relations(l2Tx, ({ one }) => ({
  droppedTx: one(droppedTx, {
    fields: [l2Tx.hash],
    references: [droppedTx.txHash],
  }),
}));
