import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  globalVariables,
  header,
  l2Block,
} from "../../../database/schema/index.js";
import { CURRENT_ROLLUP_VERSION } from "../../../../constants/versions.js";
import { getExistingRollupVersion } from "./get-latest.js";

export const getAverageFees = async (): Promise<string> => {
  const rollupVersion =
    (await getExistingRollupVersion()) ?? parseInt(CURRENT_ROLLUP_VERSION);

  const dbRes = await db()
    .select({
      average: sql<string>`cast(avg(${header.totalFees}) as numeric)`,
    })
    .from(header)
    .innerJoin(l2Block, eq(header.blockHash, l2Block.hash))
    .where(
      and(isNull(l2Block.orphan_timestamp), eq(l2Block.version, rollupVersion)),
    )
    .execute();

  const averageStr = dbRes[0]?.average;
  if (!averageStr) {
    return "0";
  }

  return averageStr.split(".")[0] ?? "0";
};

export const getAverageBlockTime = async (): Promise<string> => {
  const rollupVersion =
    (await getExistingRollupVersion()) ?? parseInt(CURRENT_ROLLUP_VERSION);

  const dbRes = await db()
    .select({
      count: sql<number>`count(${globalVariables.id})`,
      firstTimestamp: sql<number>`min(${globalVariables.timestamp})`,
      lastTimestamp: sql<number>`max(${globalVariables.timestamp})`,
    })
    .from(globalVariables)
    .innerJoin(header, eq(globalVariables.headerId, header.id))
    .innerJoin(l2Block, eq(header.blockHash, l2Block.hash))
    .where(
      and(isNull(l2Block.orphan_timestamp), eq(l2Block.version, rollupVersion)),
    )
    .execute();

  if (dbRes[0].count < 2) {
    return "0";
  }
  const averageBlockTimeMs =
    (dbRes[0].lastTimestamp - dbRes[0].firstTimestamp) / (dbRes[0].count - 1);
  return Math.round(averageBlockTimeMs).toString();
};
