import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { l2Tx } from "../l2tx/index.js";

export const callTypeEnum = pgEnum("call_type", [
  "non_revertible",
  "revertible",
  "teardown",
]);

export const l2TxPublicCallRequest = pgTable(
  "tx_public_call_request",
  {
    txHash: varchar("tx_hash").notNull().$type<HexString>(),
    msgSender: generateAztecAddressColumn("msg_sender").notNull(),
    contractAddress: generateAztecAddressColumn("contract_address").notNull(),
    isStaticCall: boolean("is_static_call").notNull(),
    calldataHash: varchar("calldata_hash").notNull().$type<HexString>(),
    callType: callTypeEnum("call_type").notNull().default("revertible"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.txHash, table.calldataHash] }),
  }),
);

export const l2TxPublicCallRequestRelations = relations(
  l2TxPublicCallRequest,
  ({ one }) => ({
    tx: one(l2Tx, {
      fields: [l2TxPublicCallRequest.txHash],
      references: [l2Tx.txHash],
    }),
  }),
);
