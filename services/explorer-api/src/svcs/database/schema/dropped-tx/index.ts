import { HexString } from "@chicmoz-pkg/types";
import {
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { txEffect } from "../l2block/body.js";

// Enum for the reason a transaction was dropped
export const dropReasonEnum = pgEnum("drop_reason", ["reorg", "stale"]);

// Enum for the previous state of the transaction before it was dropped
export const previousStateEnum = pgEnum("previous_state", ["pending", "included"]);

// The main dropped_tx table
export const droppedTx = pgTable("dropped_tx", {
  txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
  reason: dropReasonEnum("reason").notNull(),
  previousState: previousStateEnum("previous_state").notNull(),
  orphanedTxEffectHash: varchar("orphaned_tx_effect_hash").$type<HexString>()
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
