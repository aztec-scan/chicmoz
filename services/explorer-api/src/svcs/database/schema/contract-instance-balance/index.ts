import { generateAztecAddressColumn } from "@chicmoz-pkg/backend-utils";
import { pgTable, primaryKey } from "drizzle-orm/pg-core";
import { generateUint256Column, generateTimestampColumn } from "../utils.js";

export const contractInstanceBalance = pgTable(
  "contract_instance_balance",
  {
    contractAddress: generateAztecAddressColumn("contract_address").notNull(),
    balance: generateUint256Column("balance").notNull(),
    timestamp: generateTimestampColumn("timestamp").notNull(),
  },
  (t) => ({
    pk: primaryKey({
      name: "contract_instance_balance_pk",
      columns: [t.contractAddress, t.timestamp],
    }),
  }),
);
