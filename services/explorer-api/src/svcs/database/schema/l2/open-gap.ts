import { L2BlockRangeRequestReason } from "@chicmoz-pkg/message-registry";
import { L2NetworkId } from "@chicmoz-pkg/types";
import {
  bigint,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { l2NetworkIdDbEnum } from "../utils.js";

const blockNumber = (name: string) => bigint(name, { mode: "number" });

export const l2OpenGapTable = pgTable(
  "l2_open_gap",
  {
    id: varchar("id").primaryKey(),
    l2NetworkId: l2NetworkIdDbEnum("l2_network_id")
      .notNull()
      .$type<L2NetworkId>(),
    fromHeight: blockNumber("from_height").notNull(),
    toHeight: blockNumber("to_height").notNull(),
    reason: varchar("reason").notNull().$type<L2BlockRangeRequestReason>(),
    statusHint: varchar("status_hint").notNull().$type<"proposed">(),
    status: varchar("status").notNull().$type<"open" | "fulfilled">().default("open"),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    requestCount: integer("request_count").notNull().default(0),
    lastRequestedAt: timestamp("last_requested_at"),
    fulfilledAt: timestamp("fulfilled_at"),
    lastError: varchar("last_error"),
  },
  (table) => ({
    l2OpenGapRangeKey: uniqueIndex("l2_open_gap_range_key").on(
      table.l2NetworkId,
      table.fromHeight,
      table.toHeight,
      table.reason,
    ),
  }),
);

export type L2OpenGapRow = typeof l2OpenGapTable.$inferSelect;
