import { relations, sql } from "drizzle-orm";
import { pgTable, integer, pgEnum, primaryKey, bigint, decimal, check } from "drizzle-orm/pg-core";
import {
  generateEthAddressColumn,
  generateTimestampColumn,
} from "../utils.js";
import { slotStatusEnumSchema } from "@chicmoz-pkg/types"


export const slotStatusColumn = pgEnum("slot_status", slotStatusEnumSchema.options) // Share this stuff with the types

export const SentinelValidatorTable = pgTable("sentinel_validator", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  lastSeenAt: generateTimestampColumn("last_seen_at").default(0),
  lastSeenAtSlot: bigint("last_seen_at_slot", { mode: "bigint" }).default(0n), // Maybe just use this and do a slot > timestamp call
  totalSlots: integer("total_slots").default(0)
});

export const SentinelHistoryTable = pgTable("sentinel_validator_history", {
  attester: generateEthAddressColumn("attester").notNull(),
  slot: bigint("slot", { mode: "bigint" }).notNull(),
  status: slotStatusColumn("status").notNull(),
},
  (table) => ({
    pk: primaryKey({ columns: [table.attester, table.slot] }),
    fk_attester: {
      columns: [table.attester],
      foreignColumns: [SentinelValidatorTable.attester],
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  }),
);

export const SentinelMissedBlockTable = pgTable("sentinel_validator_missed_blocks", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  count: integer("count").notNull(),
  currentStreak: integer("current_streak").notNull(),
  rate: decimal("rate", { precision: 6, scale: 4 }).notNull()
},
  (table) => ({
    fk_attester: {
      columns: [table.attester],
      foreignColumns: [SentinelValidatorTable.attester],
      onDelete: "cascade",
      onUpdate: "cascade",
    },
    chk_nonneg: check("ma_nonneg", sql`${table.count} >= 0 AND ${table.currentStreak} >= 0`),
    chk_rate: check("ma_rate_0_1", sql`${table.rate} >= 0 AND ${table.rate} <= 1`),
  }),
);

export const SentinelMissedAttestationTable = pgTable("sentinel_validator_missed_attestations", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  count: integer("count").notNull(),
  currentStreak: integer("current_streak").notNull(),
  rate: decimal("rate", { precision: 6, scale: 4 }).notNull()
},
  (table) => ({
    fk_attester: {
      columns: [table.attester],
      foreignColumns: [SentinelValidatorTable.attester],
      onDelete: "cascade",
      onUpdate: "cascade",
    },
    chk_nonneg: check("ma_nonneg", sql`${table.count} >= 0 AND ${table.currentStreak} >= 0`),
    chk_rate: check("ma_rate_0_1", sql`${table.rate} IS NULL OR (${table.rate} >= 0 AND ${table.rate} <= 1)`),
  }),
);

export const SentinelValidatorRelations = relations(
  SentinelValidatorTable,
  ({ many }) => ({
    history: many(SentinelHistoryTable),
  }),
);

export const SentinelValidatorMissedBlockRelations = relations(
  SentinelMissedBlockTable,
  ({ one }) => ({
    attester: one(SentinelValidatorTable ,{
      fields: [SentinelMissedBlockTable.attester],
      references: [SentinelValidatorTable.attester],
    }),
  }),
);

export const SentinelMissedAttestationTableRelations = relations(
  SentinelMissedAttestationTable,
  ({ one }) => ({
    attester: one(SentinelValidatorTable ,{
      fields: [SentinelMissedAttestationTable.attester],
      references: [SentinelValidatorTable.attester],
    }),
  }),
);