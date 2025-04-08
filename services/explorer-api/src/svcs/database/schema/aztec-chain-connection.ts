import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const aztecChainConnection = pgTable("aztec-chain-connection", {
  hash: varchar("hash").primaryKey().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  chainHeight: integer("chain_height").notNull(),
  latestProcessedHeight: integer("latest_processed_height").notNull(),
  counter: integer("counter").notNull().default(0),
  // below is part of the hash
  rpcUrl: varchar("rpc_url").notNull(),
  nodeVersion: varchar("node_version").notNull(),
  l1ChainId: integer("l1_chain_id").notNull(),
  rollupVersion: integer("rollup_version").notNull(),
  enr: varchar("enr"),
  l1ContractAddresses: jsonb("l1_contract_addresses").notNull(),
  protocolContractAddresses: jsonb("protocol_contract_addresses").notNull(),
});
