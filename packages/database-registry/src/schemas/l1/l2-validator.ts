import { relations, sql } from "drizzle-orm";
import { bigint, pgTable, primaryKey, smallint } from "drizzle-orm/pg-core";
import {
  generateEthAddressColumn,
  generateTimestampColumn,
} from "@chicmoz-pkg/postgres-helper";

export const l1L2ValidatorTable = pgTable("l1_l2_validator", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  firstSeenAt: generateTimestampColumn("first_seen_at").notNull(),
  rollupAddress: generateEthAddressColumn("rollup_address").notNull(),
  withdrawer: generateEthAddressColumn("withdrawer").notNull(),
  proposer: generateEthAddressColumn("proposer").notNull(),
  stake: bigint("stake", { mode: "bigint" }),
});

export const l1L2ValidatorStatusTable = pgTable(
  "l1_l2_validator_status",
  {
    attesterAddress: generateEthAddressColumn("attester_address")
      .notNull()
      .references(() => l1L2ValidatorTable.attester, { onDelete: "cascade" }),
    status: smallint("status").notNull(),
    timestamp: generateTimestampColumn("timestamp")
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.attesterAddress, table.timestamp] }),
  }),
);

export const l1l2ValidatorRelations = relations(
  l1L2ValidatorTable,
  ({ many }) => ({
    statuses: many(l1L2ValidatorStatusTable),
  }),
);

export const l1L2ValidatorStatusRelations = relations(
  l1L2ValidatorStatusTable,
  ({ one }) => ({
    attester: one(l1L2ValidatorTable, {
      fields: [l1L2ValidatorStatusTable.attesterAddress],
      references: [l1L2ValidatorTable.attester],
    }),
  }),
);
