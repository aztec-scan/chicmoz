import { relations } from "drizzle-orm";
import { pgTable, integer, pgEnum, primaryKey, bigint } from "drizzle-orm/pg-core";
import {
  generateEthAddressColumn,
  generateTimestampColumn,
} from "../utils.js";
import { slotStatusEnumSchema } from "@chicmoz-pkg/types"


export const slotStatusColumn = pgEnum("slot_status", slotStatusEnumSchema.options) // Share this stuff with the types

export const SentinelValidatorTable = pgTable("sentinel_validator", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  lastSeenAt: generateTimestampColumn("last_seen_at"),
  lastSeenAtSlot: bigint("last_seen_at_slot", { mode: "bigint" }),
  totalSlots: integer("total_slots").default(0),
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

export const SentinelBlockTable = pgTable("sentinel_validator_missed_blocks", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  lastSeenAt: generateTimestampColumn("last_seen_at"),
  lastSeenAtSlot: bigint("last_seen_at_slot", { mode: "bigint" }),
  total: integer("total").notNull(),
  missed: integer("missed").notNull(),
},
  (table) => ({
    fk_attester: {
      columns: [table.attester],
      foreignColumns: [SentinelValidatorTable.attester],
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  }),
);

export const SentinelAttestationTable = pgTable("sentinel_validator_missed_attestations", {
  attester: generateEthAddressColumn("attester").primaryKey().notNull(),
  lastSeenAt: generateTimestampColumn("last_seen_at"),
  lastSeenAtSlot: bigint("last_seen_at_slot", { mode: "bigint" }),
  total: integer("total").notNull(),
  missed: integer("missed").notNull(),
},
  (table) => ({
    fk_attester: {
      columns: [table.attester],
      foreignColumns: [SentinelValidatorTable.attester],
      onDelete: "cascade",
      onUpdate: "cascade",
    }
  }),
);

export const SentinelValidatorRelations = relations(
  SentinelValidatorTable,
  ({ many }) => ({
    history: many(SentinelHistoryTable),
  }),
);

export const SentinelValidatorMissedBlockRelations = relations(
  SentinelBlockTable,
  ({ one }) => ({
    attester: one(SentinelValidatorTable ,{
      fields: [SentinelBlockTable.attester],
      references: [SentinelValidatorTable.attester],
    }),
  }),
);

export const SentinelMissedAttestationTableRelations = relations(
  SentinelAttestationTable,
  ({ one }) => ({
    attester: one(SentinelValidatorTable ,{
      fields: [SentinelAttestationTable.attester],
      references: [SentinelValidatorTable.attester],
    }),
  }),
);

export type CounterTable = typeof SentinelBlockTable | typeof SentinelAttestationTable