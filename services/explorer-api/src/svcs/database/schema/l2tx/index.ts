import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { droppedTx } from "../dropped-tx/index.js";
import { l2TxPublicCallRequest } from "../l2public-call/index.js";

export const l2Tx = pgTable("tx", {
  txHash: varchar("hash").notNull().$type<HexString>().primaryKey(),
  feePayer: generateAztecAddressColumn("fee_payer").notNull(),
  birthTimestamp: timestamp("birth_timestamp").notNull(),
});

export const l2TxRelations = relations(l2Tx, ({ one, many }) => ({
  droppedTx: one(droppedTx, {
    fields: [l2Tx.txHash],
    references: [droppedTx.txHash],
  }),
  publicCallRequests: many(l2TxPublicCallRequest),
}));
