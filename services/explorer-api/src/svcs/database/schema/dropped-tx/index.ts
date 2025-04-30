import { HexString } from "@chicmoz-pkg/types";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const droppedTx = pgTable("dropped_tx", {
  txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  droppedAt: timestamp("dropped_at").notNull(),
});
