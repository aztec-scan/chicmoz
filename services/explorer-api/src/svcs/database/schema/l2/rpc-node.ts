import { relations } from "drizzle-orm";
import {
  bigint,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { l2NetworkIdDbEnum } from "../utils.js";
import { l2RpcNodeErrorTable } from "./rpc-node-error.js";

export const l2RpcNodeTable = pgTable("l2_rpc_node", {
  rpcNodeName: varchar("rpc_node_name").primaryKey().notNull(),
  rpcUrl: varchar("rpc_url").notNull().unique(),
  l2NetworkId: l2NetworkIdDbEnum("l2_network_id"),
  rollupVersion: bigint("rollup_version", {
    mode: "bigint",
  }),
  nodeVersion: varchar("node_version"),
  l1ChainId: integer("l1_chain_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

export const l2RpcNodeRelations = relations(l2RpcNodeTable, ({ many }) => ({
  errors: many(l2RpcNodeErrorTable),
}));
