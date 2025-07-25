import {
  bigint,
  boolean,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";

import { generateEthAddressColumn, generateFrColumn, generateFrNumberColumn  } from "../utils.js";

export const l1L2BlockProposedTable = pgTable(
  "l1_l2_block_proposed",
  {
    l1ContractAddress: generateEthAddressColumn(
      "l1_contract_address",
    ).notNull(),
    l2BlockNumber: bigint("l2_block_number", { mode: "bigint" }).notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateFrNumberColumn("l1_block_timestamp").notNull(),
    isFinalized: boolean("is_finalized").default(false),
    archive: generateFrColumn("archive").notNull(),
  },
  (t) => ({
    pk: primaryKey({
      name: "block_proposal",
      columns: [t.l2BlockNumber, t.archive],
    }),
  }),
);

export const l1L2ProofVerifiedTable = pgTable(
  "l1_l2_proof_verified",
  {
    l1ContractAddress: generateEthAddressColumn(
      "l1_contract_address",
    ).notNull(),
    l2BlockNumber: bigint("l2_block_number", { mode: "bigint" }).notNull(),
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateFrNumberColumn("l1_block_timestamp").notNull(),
    isFinalized: boolean("is_finalized").default(false),
    proverId: generateEthAddressColumn("prover_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({
      name: "proof_verified",
      columns: [t.l2BlockNumber, t.proverId],
    }),
  }),
);
