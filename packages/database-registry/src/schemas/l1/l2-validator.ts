import { relations, sql } from "drizzle-orm";
import { pgTable, primaryKey, smallint } from "drizzle-orm/pg-core";
import {
  generateEthAddressColumn,
  generateUint256Column,
  generateTimestampColumn,
} from "@chicmoz-pkg/postgres-helper";

export const l1L2ValidatorTable = pgTable("l1_l2_validator", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  firstSeenAt: generateTimestampColumn("first_seen_at").notNull(),
});

export const l1L2ValidatorRollupAddress = pgTable(
  "l1_l2_validator_rollup_address",
  {
    attesterAddress: generateEthAddressColumn("attester_address")
      .notNull()
      .references(() => l1L2ValidatorTable.attester, { onDelete: "cascade" }),
    rollupAddress: generateEthAddressColumn("rollup_address").notNull(),
    timestamp: generateTimestampColumn("timestamp")
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.attesterAddress, table.timestamp] }),
  }),
);

export const l1L2ValidatorStakeTable = pgTable(
  "l1_l2_validator_stake",
  {
    attesterAddress: generateEthAddressColumn("attester_address")
      .notNull()
      .references(() => l1L2ValidatorTable.attester, { onDelete: "cascade" }),
    stake: generateUint256Column("stake").notNull(),
    timestamp: generateTimestampColumn("timestamp")
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.attesterAddress, table.timestamp] }),
  }),
);

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

export const l1L2ValidatorWithdrawerTable = pgTable(
  "l1_l2_validator_withdrawer",
  {
    attesterAddress: generateEthAddressColumn("attester_address")
      .notNull()
      .references(() => l1L2ValidatorTable.attester, { onDelete: "cascade" }),
    withdrawer: generateEthAddressColumn("withdrawer").notNull(),
    timestamp: generateTimestampColumn("timestamp")
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.attesterAddress, table.timestamp] }),
  }),
);

export const l1L2ValidatorProposerTable = pgTable(
  "l1_l2_validator_proposer",
  {
    attesterAddress: generateEthAddressColumn("attester_address")
      .notNull()
      .references(() => l1L2ValidatorTable.attester, { onDelete: "cascade" }),
    proposer: generateEthAddressColumn("proposer").notNull(),
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
    stakes: many(l1L2ValidatorStakeTable),
    statuses: many(l1L2ValidatorStatusTable),
    withdrawers: many(l1L2ValidatorWithdrawerTable),
    proposers: many(l1L2ValidatorProposerTable),
  }),
);

export const l1L2ValidatorStakeRelations = relations(
  l1L2ValidatorStakeTable,
  ({ one }) => ({
    attester: one(l1L2ValidatorTable, {
      fields: [l1L2ValidatorStakeTable.attesterAddress],
      references: [l1L2ValidatorTable.attester],
    }),
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

export const l1L2ValidatorWithdrawerRelations = relations(
  l1L2ValidatorWithdrawerTable,
  ({ one }) => ({
    attester: one(l1L2ValidatorTable, {
      fields: [l1L2ValidatorWithdrawerTable.attesterAddress],
      references: [l1L2ValidatorTable.attester],
    }),
  }),
);

export const l1L2ValidatorProposerRelations = relations(
  l1L2ValidatorProposerTable,
  ({ one }) => ({
    attester: one(l1L2ValidatorTable, {
      fields: [l1L2ValidatorProposerTable.attesterAddress],
      references: [l1L2ValidatorTable.attester],
    }),
  }),
);
