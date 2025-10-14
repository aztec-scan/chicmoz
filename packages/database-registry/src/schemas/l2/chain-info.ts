import {
  bigint,
  integer,
  jsonb,
  pgTable,
  timestamp,
} from "drizzle-orm/pg-core";
import { l2NetworkIdDbEnum } from "@chicmoz-pkg/postgres-helper";

export const l2ChainInfoTable = pgTable("l2_chain_info", {
  l2NetworkId: l2NetworkIdDbEnum("l2_network_id").primaryKey().notNull(),
  l1ChainId: integer("l1_chain_id").notNull(),
  rollupVersion: bigint("rollup_version", {
    mode: "bigint",
  }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  l1ContractAddresses: jsonb("l1_contract_addresses").notNull(),
  protocolContractAddresses: jsonb("protocol_contract_addresses").notNull(),
});
