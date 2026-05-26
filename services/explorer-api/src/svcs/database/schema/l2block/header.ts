import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import {
  generateBoundedIntegerColumn,
  generateEthAddressColumn,
  generateFrColumn,
  generateLargeIntegerColumn,
  generateTimestampColumn,
  generateTreeTable,
  generateUint256Column,
} from "../utils.js";
import { l2Block } from "./root.js";

export const header = pgTable(
  "header",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockHash: varchar("block_hash")
      .notNull()
      .$type<HexString>()
      .references(() => l2Block.hash, { onDelete: "cascade" }),
    totalFees: generateUint256Column("total_fees").notNull(),
    totalManaUsed: generateUint256Column("total_mana_used").notNull(),
    spongeBlobHash: generateFrColumn("sponge_blob_hash").notNull(),
  },
  (t) => ({
    blockHashIdx: index("header_block_hash_idx").on(t.blockHash),
  }),
);

export const lastArchive = generateTreeTable(
  "last_archive",
  uuid("header_id")
    .notNull()
    .references(() => header.id, { onDelete: "cascade" }),
);

export const state = pgTable(
  "state",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    headerId: uuid("header_id")
      .notNull()
      .references(() => header.id, { onDelete: "cascade" }),
  },
  (t) => ({
    headerIdIdx: index("state_header_id_idx").on(t.headerId),
  }),
);

export const l1ToL2MessageTree = generateTreeTable(
  "l1_to_l2_message_tree",
  uuid("state_id")
    .notNull()
    .references(() => state.id, { onDelete: "cascade" }),
);

export const partial = pgTable(
  "partial",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => state.id, { onDelete: "cascade" }),
  },
  (t) => ({
    stateIdIdx: index("partial_state_id_idx").on(t.stateId),
  }),
);

export const noteHashTree = generateTreeTable(
  "note_hash_tree",
  uuid("state_partial_id")
    .notNull()
    .references(() => partial.id, { onDelete: "cascade" }),
);

export const nullifierTree = generateTreeTable(
  "nullifier_tree",
  uuid("state_partial_id")
    .notNull()
    .references(() => partial.id, { onDelete: "cascade" }),
);

export const publicDataTree = generateTreeTable(
  "public_data_tree",
  uuid("state_partial_id")
    .notNull()
    .references(() => partial.id, { onDelete: "cascade" }),
);

export const globalVariables = pgTable(
  "global_variables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    headerId: uuid("header_id")
      .notNull()
      .references(() => header.id, { onDelete: "cascade" }),
    chainId: generateBoundedIntegerColumn("chain_id").notNull(),
    version: generateBoundedIntegerColumn("version").notNull(),
    blockNumber: generateBoundedIntegerColumn("block_number").notNull(),
    slotNumber: generateBoundedIntegerColumn("slot_number").notNull(),
    timestamp: generateTimestampColumn("timestamp").notNull(),
    coinbase: generateEthAddressColumn("coinbase").notNull(),
    feeRecipient: generateAztecAddressColumn("fee_recipient").notNull(),
  },
  (t) => ({
    headerIdIdx: index("global_variables_header_id_idx").on(t.headerId),
    versionIdx: index("global_variables_version_idx").on(t.version),
  }),
);

export const gasFees = pgTable(
  "gas_fees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    globalVariablesId: uuid("global_variables_id")
      .notNull()
      .references(() => globalVariables.id, { onDelete: "cascade" }),
    feePerDaGas: generateLargeIntegerColumn("fee_per_da_gas"),
    feePerL2Gas: generateLargeIntegerColumn("fee_per_l2_gas"),
  },
  (t) => ({
    globalVariablesIdIdx: index("gas_fees_global_variables_id_idx").on(
      t.globalVariablesId,
    ),
  }),
);
