import { relations } from "drizzle-orm";
import {
  bigint,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { l2NetworkIdDbEnum } from "../utils.js";
import { l2RpcNodeTable } from "./rpc-node.js";

export const l2SequencerTable = pgTable("l2_sequencer", {
  enr: varchar("enr").primaryKey().notNull(),
  rpcNodeId: uuid("rpc_node_id")
    .notNull()
    .references(() => l2RpcNodeTable.id, {
      onDelete: "cascade",
    }),
  l2NetworkId: l2NetworkIdDbEnum("l2_network_id").notNull(),
  rollupVersion: bigint("rollup_version", {
    mode: "bigint",
  }).notNull(),
  nodeVersion: varchar("node_version").notNull(),
  l1ChainId: integer("l1_chain_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const l2SequencerRelations = relations(l2SequencerTable, ({ one }) => ({
  rpcNode: one(l2RpcNodeTable),
}));
