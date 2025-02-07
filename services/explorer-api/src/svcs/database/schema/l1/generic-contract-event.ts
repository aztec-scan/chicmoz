import {
  bigint,
  integer,
  jsonb,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { generateEthAddressColumn } from "../utils.js";

export const l1GenericContractEventTable = pgTable(
  "l1_generic_contract_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockTimestamp: integer("l1_block_timestamp").notNull(),
    l1ContractAddress: generateEthAddressColumn(
      "l1_contract_address"
    ).notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
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
