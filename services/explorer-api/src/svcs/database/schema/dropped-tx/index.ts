import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { txEffect } from "../l2block/body.js";
import {
  droppedTxPreviousStateDbEnum,
  droppedTxReasonDbEnum,
} from "../utils.js";

// The main dropped_tx table
export const droppedTx = pgTable("dropped_tx", {
  txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
  reason: droppedTxReasonDbEnum("reason").notNull(),
  previousState: droppedTxPreviousStateDbEnum("previous_state").notNull(),
  orphanedTxEffectHash: varchar("orphaned_tx_effect_hash")
    .$type<HexString>()
    .references(() => txEffect.txHash, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  droppedAt: timestamp("dropped_at").notNull().defaultNow(),
});

// Define relations
export const droppedTxRelations = relations(droppedTx, ({ one }) => ({
  orphanedTxEffect: one(txEffect, {
    fields: [droppedTx.orphanedTxEffectHash],
    references: [txEffect.txHash],
  }),
}));
