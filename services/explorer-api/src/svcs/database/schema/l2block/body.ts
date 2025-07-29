import { HexString } from "@chicmoz-pkg/types";
import {
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  generateFrColumn,
  generateFrNumberColumn,
  generateTimestampColumn,
} from "../utils.js";
import { l2Block } from "./root.js";

export const body = pgTable(
  "body",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockHash: varchar("block_hash")
      .notNull()
      .$type<HexString>()
      .references(() => l2Block.hash, { onDelete: "cascade" }),
  },
  (t) => ({
    blockHashIdx: index("body_block_hash_idx").on(t.blockHash),
  }),
);

export const txEffect = pgTable(
  "tx_effect",
  {
    txHash: varchar("tx_hash").notNull().$type<HexString>().primaryKey(),
    bodyId: uuid("body_id")
      .notNull()
      .references(() => body.id, { onDelete: "cascade" }),
    txBirthTimestamp: generateTimestampColumn("tx_time_of_birth")
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
    index: integer("index").notNull(),
    revertCode: smallint("revert_code").notNull(),
    transactionFee: generateFrNumberColumn("transaction_fee").notNull(),
    // NOTE: below three are arrays of Fr they might be needed in separate tables
    noteHashes: jsonb("note_hashes").notNull(),
    nullifiers: jsonb("nullifiers").notNull(),
    l2ToL1Msgs: jsonb("l2_to_l1_msgs").notNull().$type<HexString[]>(),
    privateLogs: jsonb("private_logs").notNull(),
    publicLogs: jsonb("public_logs").notNull(),
    contractClassLogs: jsonb("contract_class_logs").notNull(),
  },
  (table) => ({
    txHashIndex: index("tx_hash_index").on(table.txHash),
    bodyIdIndex: index("tx_effect_body_id_idx").on(table.bodyId),
    indexIndex: index("tx_effect_index_idx").on(table.index),
    bodyIdIndexIndex: index("tx_effect_body_id_index_idx").on(
      table.bodyId,
      table.index,
    ),
  }),
);

export const publicDataWrite = pgTable(
  "public_data_write",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    txEffectHash: varchar("tx_effect_hash")
      .notNull()
      .references(() => txEffect.txHash, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    leafSlot: generateFrColumn("leaf_slot").notNull(),
    value: generateFrColumn("value").notNull(),
  },
  (t) => ({
    txEffectHashIdx: index("public_data_write_tx_effect_hash_idx").on(
      t.txEffectHash,
    ),
    indexIdx: index("public_data_write_index_idx").on(t.index),
    txEffectHashIndexIdx: index(
      "public_data_write_tx_effect_hash_index_idx",
    ).on(t.txEffectHash, t.index),
  }),
);
