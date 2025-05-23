import { relations } from "drizzle-orm";
import { pgTable, primaryKey, smallint, timestamp } from "drizzle-orm/pg-core";
import { generateEthAddressColumn, generateUint256Column } from "../utils.js";

export const l1L2ValidatorTable = pgTable(
  "l1_l2_validator",
  {
    attester: generateEthAddressColumn("attester").notNull(),
    rollupAddress: generateEthAddressColumn("rollup_address").notNull(),
    firstSeenAt: timestamp("first_seen_at").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.attester, table.rollupAddress] }),
  }),
);

// TODO: is it better to have block-height instead of timestamp for all below?

export const l1L2ValidatorStakeTable = pgTable(
  "l1_l2_validator_stake",
  {
    attesterAddress: generateEthAddressColumn("attester_address")
      .notNull()
      .references(() => l1L2ValidatorTable.attester, { onDelete: "cascade" }),
    stake: generateUint256Column("stake").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
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
    timestamp: timestamp("timestamp").defaultNow().notNull(),
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
    timestamp: timestamp("timestamp").defaultNow().notNull(),
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
    timestamp: timestamp("timestamp").defaultNow().notNull(),
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
