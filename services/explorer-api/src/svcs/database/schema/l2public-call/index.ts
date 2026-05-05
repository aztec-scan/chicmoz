import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { HexString } from "@chicmoz-pkg/types";
import {
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";

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
    // Raw 4-byte function selector. TODO: ABI decoding to human-readable name + params.
    functionSelector: varchar("function_selector"),
    // Resolved from artifact at write time (or backfilled when artifact is uploaded).
    // NULL when artifact is not yet available.
    contractName: varchar("contract_name"),
    functionName: varchar("function_name"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.txHash, table.calldataHash] }),
  }),
);
