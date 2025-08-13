import { HexString } from "@chicmoz-pkg/types";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { generateTimestampColumn } from "../utils.js";

export const droppedTx = pgTable("dropped_tx", {
  txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
  createdAsPendingAt: generateTimestampColumn(
    "created_as_pending_at",
  ).notNull(),
  droppedAt: generateTimestampColumn("dropped_at").notNull(),
});
