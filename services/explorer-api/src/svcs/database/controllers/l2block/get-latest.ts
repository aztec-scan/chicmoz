import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { and, desc, eq, isNull } from "drizzle-orm";
import { l2Block } from "../../../database/schema/l2block/index.js";
import { CURRENT_ROLLUP_VERSION } from "../../../../constants/versions.js";
import { BlockQueryOptions, getBlock } from "./get-block.js";

export const getLatestBlock = async (
  options: BlockQueryOptions = {},
): Promise<ChicmozL2BlockLight | null> => {
  return getBlock(-1n, options);
};

const getBlockFilters = (options: BlockQueryOptions) => {
  const { includeOrphaned = false } = options;

  const orphanFilter = includeOrphaned
    ? undefined
    : isNull(l2Block.orphan_timestamp);
  return {
    orphanFilter,
    currentVersion: parseInt(CURRENT_ROLLUP_VERSION),
  };
};

export const getLatestHeight = async (
  options: BlockQueryOptions = {},
): Promise<bigint | null> => {
  const { orphanFilter, currentVersion } = getBlockFilters(options);

  const latestHeightForCurrentVersion = await db()
    .select({ height: l2Block.height })
    .from(l2Block)
    .where(
      orphanFilter
        ? and(orphanFilter, eq(l2Block.version, currentVersion))
        : eq(l2Block.version, currentVersion),
    )
    .orderBy(desc(l2Block.height))
    .limit(1)
    .execute();

  if (latestHeightForCurrentVersion.length > 0) {
    return latestHeightForCurrentVersion[0].height;
  }

  const latestHeightAnyVersion = await db()
    .select({ height: l2Block.height })
    .from(l2Block)
    .where(orphanFilter)
    .orderBy(desc(l2Block.height))
    .limit(1)
    .execute();

  if (latestHeightAnyVersion.length === 0) {
    return null;
  }

  return latestHeightAnyVersion[0].height;
};

export const getExistingRollupVersion = async (
  options: BlockQueryOptions = {},
): Promise<number | null> => {
  const { orphanFilter, currentVersion } = getBlockFilters(options);

  const hasCurrentVersion = await db()
    .select({ height: l2Block.height })
    .from(l2Block)
    .where(
      orphanFilter
        ? and(orphanFilter, eq(l2Block.version, currentVersion))
        : eq(l2Block.version, currentVersion),
    )
    .limit(1)
    .execute();

  if (hasCurrentVersion.length > 0) {
    return currentVersion;
  }

  const anyVersion = await db()
    .select({ version: l2Block.version })
    .from(l2Block)
    .where(orphanFilter)
    .orderBy(desc(l2Block.height))
    .limit(1)
    .execute();

  if (anyVersion.length === 0) {
    return null;
  }

  return anyVersion[0].version;
};
