import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  globalVariables,
  header,
  l2Block,
} from "../../../database/schema/index.js";
import { CURRENT_ROLLUP_VERSION } from "../../../../constants/versions.js";

export const getAverageFees = async (): Promise<string> => {
  const dbRes = await db()
    .select({
      average: sql<string>`cast(avg(${header.totalFees}) as numeric)`,
    })
    .from(header)
    .innerJoin(l2Block, eq(header.blockHash, l2Block.hash))
    .where(
      and(
        isNull(l2Block.orphan_timestamp),
        eq(l2Block.version, parseInt(CURRENT_ROLLUP_VERSION)),
      ),
    )
    .execute();
  return dbRes[0].average.split(".")[0];
};

export const getAverageBlockTime = async (): Promise<string> => {
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
      and(
        isNull(l2Block.orphan_timestamp),
        eq(l2Block.version, parseInt(CURRENT_ROLLUP_VERSION)),
      ),
    )
    .execute();

  if (dbRes[0].count < 2) {
    return "0";
  }
  const averageBlockTimeMs =
    (dbRes[0].lastTimestamp - dbRes[0].firstTimestamp) / (dbRes[0].count - 1);
  return Math.round(averageBlockTimeMs).toString();
};
