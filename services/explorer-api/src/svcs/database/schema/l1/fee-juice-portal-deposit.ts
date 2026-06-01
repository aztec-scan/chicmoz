import {
  bigint,
  boolean,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { generateTimestampColumn } from "../utils.js";

/**
 * Stores each L1→L2 fee juice deposit (FeeJuicePortal.DepositToAztecPublic events).
 * `to` is the L2 recipient as a bytes32/Fr hex string.
 * `amount` is the fee juice amount in wei (uint256, stored as bigint).
 */
export const l1FeeJuicePortalDepositTable = pgTable(
  "l1_fee_juice_portal_deposit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // L1 context
    l1BlockNumber: bigint("l1_block_number", { mode: "bigint" }).notNull(),
    l1BlockHash: varchar("l1_block_hash").notNull(),
    l1BlockTimestamp: generateTimestampColumn("l1_block_timestamp").notNull(),
    l1ContractAddress: varchar("l1_contract_address").notNull(),
    l1TransactionHash: varchar("l1_transaction_hash"),
    l1LogIndex: bigint("l1_log_index", { mode: "number" }),
    isFinalized: boolean("is_finalized").notNull().default(false),
    /** L1 address of the depositor (msg.sender on the portal tx). Nullable for historical rows. */
    l1Sender: varchar("l1_sender"),
    // DepositToAztecPublic fields
    /** L2 recipient (bytes32 / Fr as hex). */
    to: varchar("to").notNull(),
    /** Fee juice amount in wei. */
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    secretHash: varchar("secret_hash").notNull(),
    /** Inbox message key (bytes32). */
    key: varchar("key").notNull(),
    /** Inbox leaf index. */
    index: bigint("index", { mode: "bigint" }).notNull(),
  },
  (table) => ({
    l1FeeJuiceDepositLogUnique: uniqueIndex(
      "l1_fee_juice_deposit_log_unique",
    ).on(
      table.l1TransactionHash,
      table.l1LogIndex,
      table.l1ContractAddress,
      table.isFinalized,
    ),
  }),
);
