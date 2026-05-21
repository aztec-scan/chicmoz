import { ChicmozL2Tips, HexString, L2NetworkId } from "@chicmoz-pkg/types";
import { bigint, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { l2NetworkIdDbEnum } from "../utils.js";

const blockNumber = (name: string) => bigint(name, { mode: "number" });

export const l2TipsTable = pgTable("l2_tips", {
  l2NetworkId: l2NetworkIdDbEnum("l2_network_id")
    .primaryKey()
    .notNull()
    .$type<L2NetworkId>(),
  proposedBlockNumber: blockNumber("proposed_block_number").notNull(),
  proposedBlockHash: varchar("proposed_block_hash").notNull().$type<HexString>(),
  proposedCheckpointBlockNumber: blockNumber("proposed_checkpoint_block_number"),
  proposedCheckpointBlockHash: varchar("proposed_checkpoint_block_hash").$type<HexString>(),
  proposedCheckpointNumber: blockNumber("proposed_checkpoint_number"),
  proposedCheckpointHash: varchar("proposed_checkpoint_hash").$type<HexString>(),
  checkpointedBlockNumber: blockNumber("checkpointed_block_number").notNull(),
  checkpointedBlockHash: varchar("checkpointed_block_hash").notNull().$type<HexString>(),
  checkpointedCheckpointNumber: blockNumber("checkpointed_checkpoint_number").notNull(),
  checkpointedCheckpointHash: varchar("checkpointed_checkpoint_hash").notNull().$type<HexString>(),
  provenBlockNumber: blockNumber("proven_block_number").notNull(),
  provenBlockHash: varchar("proven_block_hash").notNull().$type<HexString>(),
  provenCheckpointNumber: blockNumber("proven_checkpoint_number").notNull(),
  provenCheckpointHash: varchar("proven_checkpoint_hash").notNull().$type<HexString>(),
  finalizedBlockNumber: blockNumber("finalized_block_number").notNull(),
  finalizedBlockHash: varchar("finalized_block_hash").notNull().$type<HexString>(),
  finalizedCheckpointNumber: blockNumber("finalized_checkpoint_number").notNull(),
  finalizedCheckpointHash: varchar("finalized_checkpoint_hash").notNull().$type<HexString>(),
  observedAt: bigint("observed_at", { mode: "number" }).notNull(),
  aztecNodeName: varchar("aztec_node_name"),
  aztecNodeVersion: varchar("aztec_node_version"),
  degradedReason: varchar("degraded_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type L2TipsRow = typeof l2TipsTable.$inferSelect;
export type L2TipsInsert = typeof l2TipsTable.$inferInsert;

export type StoredL2Tips = ChicmozL2Tips & {
  observedAt: number;
  source: {
    rpcNodeName?: string;
    aztecNodeVersion?: string;
  };
  degradedReason?: string;
};
