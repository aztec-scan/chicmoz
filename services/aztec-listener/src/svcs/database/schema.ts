import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

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
  birthTimestamp: timestamp("birth_timestamp").notNull().defaultNow(),
  txState: varchar("tx_state").notNull().$type<TxState>(),
});
