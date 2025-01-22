import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { l2RpcNodeTable } from "./rpc-node.js";

export const l2RpcNodeErrorTable = pgTable("l2_rpc_node_error", {
  name: varchar("name").primaryKey().notNull(),
  rpcUrl: varchar("rpc_url")
    .notNull()
    .references(() => l2RpcNodeTable.rpcUrl, { onDelete: "cascade" }),
  cause: varchar("cause").notNull(),
  message: varchar("message").notNull(),
  stack: varchar("stack").notNull(),
  data: jsonb("data").notNull(),
  count: integer("count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const l2RpcNodeErrorRelations = relations(
  l2RpcNodeErrorTable,
  ({ one }) => ({
    rpcNode: one(l2RpcNodeTable),
  })
);
