import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { bigint, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";

export const contractInstanceBalance = pgTable(
  "contract_instance_balance",
  {
    contractAddress: generateAztecAddressColumn("contract_address").notNull(),
    balance: bigint("balance", { mode: "bigint" }).notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({
      name: "contract_instance_balance_pk",
      columns: [t.contractAddress, t.timestamp],
    }),
  }),
);
