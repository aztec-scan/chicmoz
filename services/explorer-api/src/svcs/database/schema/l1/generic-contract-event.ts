import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { generateEthAddressColumn, generateFrNumberColumn } from "../utils.js";

export const l1GenericContractEventTable = pgTable(
  "l1_generic_contract_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockTimestamp: generateFrNumberColumn("l1_block_timestamp").notNull(),
    l1ContractAddress: generateEthAddressColumn(
      "l1_contract_address"
    ).notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
    isFinalized: boolean("is_finalized").notNull().default(false),
    eventName: varchar("event_name").notNull(),
    eventArgs: jsonb("event_args"),
  },
  (table) => ({
    unique: {
      l1BlockNumber_l1ContractAddress_eventName: [
        table.l1BlockNumber,
        table.l1ContractAddress,
        table.eventName,
        table.eventArgs,
      ],
    },
  })
);
