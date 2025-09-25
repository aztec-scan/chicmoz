import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2BlockLight , CURRENT_ROLLUP_VERSION } from "@chicmoz-pkg/types";
import { and, desc, eq, isNull } from "drizzle-orm";
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
  const latestBlockNumber = await (
    includeOrphaned
      ? db()
          .select({ height: l2Block.height })
          .from(l2Block)
          .where(eq(l2Block.version, parseInt(CURRENT_ROLLUP_VERSION)))
          .orderBy(desc(l2Block.height))
          .limit(1)
      : db()
          .select({ height: l2Block.height })
          .from(l2Block)
          .where(
            and(
              isNull(l2Block.orphan_timestamp),
              eq(l2Block.version, parseInt(CURRENT_ROLLUP_VERSION)),
            ),
          )
          .orderBy(desc(l2Block.height))
          .limit(1)
  ).execute();

  if (latestBlockNumber.length === 0) {
    return null;
  }
  return latestBlockNumber[0].height;
};
