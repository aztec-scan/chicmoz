import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import { integer, numeric, pgTable, varchar } from "drizzle-orm/pg-core";
import { droppedTx } from "../dropped-tx/index.js";
import { generateTimestampColumn } from "../utils.js";
import { l2TxPublicCallRequest } from "../l2public-call/index.js";

export const l2Tx = pgTable("tx", {
  txHash: varchar("hash").notNull().$type<HexString>().primaryKey(),
  feePayer: generateAztecAddressColumn("fee_payer").notNull(),
  birthTimestamp: generateTimestampColumn("birth_timestamp").notNull(),
  // Expiration
  expirationTimestamp: integer("expiration_timestamp"),
  // Gas limits
  gasLimitDa: integer("gas_limit_da"),
  gasLimitL2: integer("gas_limit_l2"),
  teardownGasLimitDa: integer("teardown_gas_limit_da"),
  teardownGasLimitL2: integer("teardown_gas_limit_l2"),
  // Max fees (numeric to preserve bigint precision)
  maxFeePerDaGas: numeric("max_fee_per_da_gas", { precision: 77, scale: 0 }),
  maxFeePerL2Gas: numeric("max_fee_per_l2_gas", { precision: 77, scale: 0 }),
  maxPriorityFeePerDaGas: numeric("max_priority_fee_per_da_gas", {
    precision: 77,
    scale: 0,
  }),
  maxPriorityFeePerL2Gas: numeric("max_priority_fee_per_l2_gas", {
    precision: 77,
    scale: 0,
  }),
  // Gas used in private phase
  gasUsedDa: integer("gas_used_da"),
  gasUsedL2: integer("gas_used_l2"),
  // Fee payment method ('fee_juice' | 'fpc')
  feePaymentMethod: varchar("fee_payment_method"),
  // Summary counts
  noteHashCount: integer("note_hash_count"),
  nullifierCount: integer("nullifier_count"),
  l2ToL1MsgCount: integer("l2_to_l1_msg_count"),
  privateLogCount: integer("private_log_count"),
});

export const l2TxRelations = relations(l2Tx, ({ one, many }) => ({
  droppedTx: one(droppedTx, {
    fields: [l2Tx.txHash],
    references: [droppedTx.txHash],
  }),
  publicCallRequests: many(l2TxPublicCallRequest),
}));
