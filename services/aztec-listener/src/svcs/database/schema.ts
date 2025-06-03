import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { HexString } from "@chicmoz-pkg/types";

export const heightsTable = pgTable(
  "heights",
  {
    networkId: varchar("networkId").primaryKey().notNull(),
    processedProposedBlockHeight: integer("processedProposedBlockHeight").notNull(),
    chainProposedBlockHeight: integer("chainProposedBlockHeight").notNull(),
    processedProvenBlockHeight: integer("processedProvenBlockHeight").notNull(),
    chainProvenBlockHeight: integer("chainProvenBlockHeight").notNull(),
  }
);

export const pendingTxsTable = pgTable(
  "pending_txs",
  {
    txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
    feePayer: varchar("fee_payer").notNull().$type<HexString>(),
    birthTimestamp: timestamp("birth_timestamp").notNull().defaultNow(),
  }
);
