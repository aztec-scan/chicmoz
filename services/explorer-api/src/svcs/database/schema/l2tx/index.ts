import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { droppedTx } from "../dropped-tx/index.js";

export const l2Tx = pgTable("tx", {
  txHash: varchar("hash").notNull().$type<HexString>().primaryKey(),
  feePayer: generateAztecAddressColumn("fee_payer").notNull(),
  birthTimestamp: timestamp("birth_timestamp").notNull(),
});

export const l2TxPublicCallRequest = pgTable("tx_public_call_request", {
  id: varchar("id").notNull().primaryKey(),
  txHash: varchar("tx_hash").notNull().$type<HexString>(),
  msgSender: generateAztecAddressColumn("msg_sender").notNull(),
  contractAddress: generateAztecAddressColumn("contract_address").notNull(),
  isStaticCall: boolean("is_static_call").notNull(),
  calldataHash: varchar("calldata_hash").notNull().$type<HexString>(),
});

export const l2TxRelations = relations(l2Tx, ({ one, many }) => ({
  droppedTx: one(droppedTx, {
    fields: [l2Tx.txHash],
    references: [droppedTx.txHash],
  }),
  publicCallRequests: many(l2TxPublicCallRequest),
}));

export const l2TxPublicCallRequestRelations = relations(l2TxPublicCallRequest, ({ one }) => ({
  tx: one(l2Tx, {
    fields: [l2TxPublicCallRequest.txHash],
    references: [l2Tx.txHash],
  }),
}));
