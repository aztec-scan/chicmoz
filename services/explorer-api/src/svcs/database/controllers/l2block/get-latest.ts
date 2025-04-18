import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { desc, isNull } from "drizzle-orm";
import { l2Block } from "../../../database/schema/l2block/index.js";
import { BlockQueryOptions, getBlock } from "./get-block.js";

export const getLatestBlock = async (
  options: BlockQueryOptions = {},
): Promise<ChicmozL2BlockLight | null> => {
  return getBlock(-1n, options);
};

export const getLatestHeight = async (
  options: BlockQueryOptions = {},
): Promise<bigint | null> => {
  const { includeOrphaned = false } = options;

  // Execute the appropriate query based on the includeOrphaned flag
  const latestBlockNumber = await (includeOrphaned
    ? db()
        .select({ height: l2Block.height })
        .from(l2Block)
        .orderBy(desc(l2Block.height))
        .limit(1)
    : db()
        .select({ height: l2Block.height })
        .from(l2Block)
        .where(isNull(l2Block.orphan_timestamp))
        .orderBy(desc(l2Block.height))
        .limit(1)
  ).execute();

  if (latestBlockNumber.length === 0) {
    return null;
  }
  return latestBlockNumber[0].height;
};
