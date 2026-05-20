import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { generateEthAddressColumn, generateTimestampColumn } from "../utils.js";

export const l1GenericContractEventTable = pgTable(
  "l1_generic_contract_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1ContractAddress: generateEthAddressColumn(
      "l1_contract_address",
    ).notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
    l1LogIndex: bigint("l1_log_index", { mode: "number" }),
    isFinalized: boolean("is_finalized").notNull().default(false),
    eventName: varchar("event_name").notNull(),
    eventArgs: jsonb("event_args"),
  },
  (table) => ({
    l1GenericEventLogUnique: uniqueIndex("l1_generic_event_log_unique").on(
      table.l1TransactionHash,
      table.l1LogIndex,
      table.l1ContractAddress,
      table.isFinalized,
    ),
  }),
);
