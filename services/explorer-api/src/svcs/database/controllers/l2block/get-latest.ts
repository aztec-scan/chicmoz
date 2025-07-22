import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  globalVariables,
  header,
  l2Block,
} from "../../../database/schema/l2block/index.js";
import { CURRENT_ROLLUP_VERSION } from "../../../../constants/versions.js";
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
          .innerJoin(header, eq(l2Block.hash, header.blockHash))
          .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
          .where(eq(globalVariables.version, parseInt(CURRENT_ROLLUP_VERSION)))
          .orderBy(desc(l2Block.height))
          .limit(1)
      : db()
          .select({ height: l2Block.height })
          .from(l2Block)
          .where(
            and(
              isNull(l2Block.orphan_timestamp),
              eq(globalVariables.version, parseInt(CURRENT_ROLLUP_VERSION)),
            ),
          )
          .innerJoin(header, eq(l2Block.hash, header.blockHash))
          .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
          .orderBy(desc(l2Block.height))
          .limit(1)
  ).execute();

  if (latestBlockNumber.length === 0) {
    return null;
  }
  return latestBlockNumber[0].height;
};
