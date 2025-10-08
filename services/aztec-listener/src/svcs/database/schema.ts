import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { sql } from "drizzle-orm";
import { bigint, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const generateTimestampColumn = (name: string) =>
  bigint(name, { mode: "number" });

export const heightsTable = pgTable("heights", {
  networkId: varchar("networkId").primaryKey().notNull(),
  processedProposedBlockHeight: integer(
    "processedProposedBlockHeight",
  ).notNull(),
  chainProposedBlockHeight: integer("chainProposedBlockHeight").notNull(),
  processedProvenBlockHeight: integer("processedProvenBlockHeight").notNull(),
  chainProvenBlockHeight: integer("chainProvenBlockHeight").notNull(),
});

export const txStateValues = [
  "pending",
  "suspected_dropped",
  "dropped",
  "proposed",
  "proven",
] as const;
export type TxState = (typeof txStateValues)[number];

export const txsTable = pgTable("txs_table", {
  txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
  feePayer: generateAztecAddressColumn("fee_payer").notNull(),
  birthTimestamp: generateTimestampColumn("birth_timestamp")
    .notNull()
    .default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
  txState: varchar("tx_state").notNull().$type<TxState>(),
});

export const slotsTable = pgTable("slots", {
  networkId: varchar("network_id").primaryKey().notNull(),
  lastProcessedSlot: bigint("last_processed_slot", { mode: "bigint" }).notNull(),
});
