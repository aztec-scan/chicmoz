import { HexString } from "@chicmoz-pkg/types";
import {
  bigint,
  index,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { l2BlockFinalizationStatusDbEnum } from "../utils.js";

export const l2BlockFinalizationStatusTable = pgTable(
  "l2BlockFinalizationStatus",
  {
    l2BlockHash: varchar("l2_block_hash").notNull().$type<HexString>(),
    l2BlockNumber: bigint("l2_block_number", { mode: "bigint" }).notNull(),
    status: l2BlockFinalizationStatusDbEnum("status").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({
      name: "l2_block_finalization_status_pk",
      columns: [t.l2BlockHash, t.status, t.l2BlockNumber],
    }),
    blockHashIdx: index("l2_block_finalization_l2blockhash_idx").on(t.l2BlockHash),
    statusIdx: index("l2_block_finalization_status_idx").on(t.status),
  })
);
