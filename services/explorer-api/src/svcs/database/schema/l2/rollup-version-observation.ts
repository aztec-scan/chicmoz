import { primaryKey, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { l2NetworkIdDbEnum } from "../utils.js";

export const l2RollupVersionObservationTable = pgTable(
  "l2_rollup_version_observation",
  {
    l2NetworkId: l2NetworkIdDbEnum("l2_network_id").notNull(),
    rollupVersion: varchar("rollup_version").notNull(),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    firstSeenSource: varchar("first_seen_source").notNull(),
    lastSeenSource: varchar("last_seen_source").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.l2NetworkId, t.rollupVersion] }),
  }),
);
