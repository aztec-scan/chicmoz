import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { desc, eq, isNull } from "drizzle-orm";
import {
  globalVariables,
  header,
  l2Block,
} from "../../../database/schema/l2block/index.js";
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
          .orderBy(desc(l2Block.height), desc(globalVariables.version))
          .limit(1)
      : db()
          .select({ height: l2Block.height })
          .from(l2Block)
          .where(isNull(l2Block.orphan_timestamp))
          .innerJoin(header, eq(l2Block.hash, header.blockHash))
          .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
          .orderBy(desc(l2Block.height), desc(globalVariables.version))
          .limit(1)
  ).execute();

  if (latestBlockNumber.length === 0) {
    return null;
  }
  return latestBlockNumber[0].height;
};
