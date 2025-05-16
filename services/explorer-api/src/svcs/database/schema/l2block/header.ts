import { bigint, index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import {
  bufferType,
  generateAztecAddressColumn,
  generateEthAddressColumn,
  generateFrNumberColumn,
  generateTreeTable,
} from "../utils.js";
import { HexString } from "@chicmoz-pkg/types";
import { l2Block } from "./root.js";

export const header = pgTable(
  "header", 
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockHash: varchar("block_hash")
      .notNull()
      .$type<HexString>()
      .references(() => l2Block.hash, { onDelete: "cascade" }),
    totalFees: bigint("total_fees", { mode: "bigint" }).notNull(),
    totalManaUsed: bigint("total_mana_used", { mode: "bigint" }).notNull(),
  },
  (t) => ({
    blockHashIdx: index("header_block_hash_idx").on(t.blockHash),
  })
);

export const lastArchive = generateTreeTable(
  "last_archive",
  uuid("header_id")
    .notNull()
    .references(() => header.id, { onDelete: "cascade" })
);

export const contentCommitment = pgTable(
  "content_commitment", 
  {
    id: uuid("id").primaryKey().defaultRandom(),
    headerId: uuid("header_id")
      .notNull()
      .references(() => header.id, { onDelete: "cascade" }),
    numTxs: generateFrNumberColumn("num_txs").notNull(),
    blobsHash: bufferType("blobs_hash").notNull(),
    inHash: bufferType("in_hash").notNull(),
    outHash: bufferType("out_hash").notNull(),
  },
  (t) => ({
    headerIdIdx: index("content_commitment_header_id_idx").on(t.headerId),
  })
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
  })
);

export const l1ToL2MessageTree = generateTreeTable(
  "l1_to_l2_message_tree",
  uuid("state_id")
    .notNull()
    .references(() => state.id, { onDelete: "cascade" })
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
  })
);

export const noteHashTree = generateTreeTable("note_hash_tree",
  uuid("state_partial_id")
    .notNull()
    .references(() => partial.id, { onDelete: "cascade" })
);

export const nullifierTree = generateTreeTable("nullifier_tree",
  uuid("state_partial_id")
    .notNull()
    .references(() => partial.id, { onDelete: "cascade" })
);

export const publicDataTree = generateTreeTable("public_data_tree",
  uuid("state_partial_id")
    .notNull()
    .references(() => partial.id, { onDelete: "cascade" })
);

export const globalVariables = pgTable(
  "global_variables", 
  {
    id: uuid("id").primaryKey().defaultRandom(),
    headerId: uuid("header_id")
      .notNull()
      .references(() => header.id, { onDelete: "cascade" }),
    chainId: generateFrNumberColumn("chain_id").notNull(),
    version: generateFrNumberColumn("version").notNull(),
    blockNumber: generateFrNumberColumn("block_number").notNull(),
    slotNumber: generateFrNumberColumn("slot_number").notNull(),
    timestamp: generateFrNumberColumn("timestamp").notNull(),
    coinbase: generateEthAddressColumn("coinbase").notNull(),
    feeRecipient: generateAztecAddressColumn("fee_recipient").notNull(),
  },
  (t) => ({
    headerIdIdx: index("global_variables_header_id_idx").on(t.headerId),
  })
);

export const gasFees = pgTable(
  "gas_fees", 
  {
    id: uuid("id").primaryKey().defaultRandom(),
    globalVariablesId: uuid("global_variables_id")
      .notNull()
      .references(() => globalVariables.id, { onDelete: "cascade" }),
    feePerDaGas: generateFrNumberColumn("fee_per_da_gas"),
    feePerL2Gas: generateFrNumberColumn("fee_per_l2_gas"),
  },
  (t) => ({
    globalVariablesIdIdx: index("gas_fees_global_variables_id_idx").on(t.globalVariablesId),
  })
);
