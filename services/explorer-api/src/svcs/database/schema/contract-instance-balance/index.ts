import { HexString } from "@chicmoz-pkg/types";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const contractInstanceBalance = pgTable("contract_instance_balance", {
  contractAddress: varchar("contract_address").notNull().$type<HexString>(),
  balance: varchar("balance").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});
