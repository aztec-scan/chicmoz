import { HexString } from "@chicmoz-pkg/types";
import {
  bigint,
  boolean,
  index,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { generateTreeTable, generateFrNumberColumn } from "../utils.js";

export const l2Block = pgTable(
  "l2Block",
  {
    hash: varchar("hash").primaryKey().notNull().$type<HexString>(),
    height: bigint("height", { mode: "bigint" }).notNull(),
    version: generateFrNumberColumn("version").notNull(),
    orphan_timestamp: timestamp("orphan_timestamp"),
    orphan_hasOrphanedParent: boolean("orphan_hasOrphanedParent"),
  },
  (t) => ({
    heightIdx: index("height_idx").on(t.height),
    versionIdx: index("l2block_version_idx").on(t.version),
    heightVersionIdx: index("l2block_height_version_idx").on(
      t.height,
      t.version,
    ),
    orphanTimestampIdx: index("orphan_timestamp_idx")
      .on(t.orphan_timestamp)
      .where(sql`${t.orphan_timestamp} IS NOT NULL`),
    heightOrphanIdx: index("height_orphan_idx").on(
      t.height,
      t.orphan_timestamp,
    ),
  }),
);

export const archive = generateTreeTable(
  "archive",
  varchar("block_hash")
    .notNull()
    .references(() => l2Block.hash, { onDelete: "cascade" }),
);
