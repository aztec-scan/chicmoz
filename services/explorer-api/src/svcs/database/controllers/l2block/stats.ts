import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { sql } from "drizzle-orm";
import { globalVariables, header } from "../../../database/schema/index.js";

export const getAverageFees = async (): Promise<string> => {
  // TODO: filter on orphaned
  const dbRes = await db()
    .select({
      average: sql<string>`cast(avg(${header.totalFees}) as numeric)`,
    })
    .from(header)
    .execute();
  return dbRes[0].average.split(".")[0];
};

export const getAverageBlockTime = async (): Promise<string> => {
  // TODO: filter on orphaned
  const dbRes = await db()
    .select({
      count: sql<number>`count(${globalVariables.id})`,
      firstTimestamp: sql<number>`min(${globalVariables.timestamp})`,
      lastTimestamp: sql<number>`max(${globalVariables.timestamp})`,
    })
    .from(globalVariables)
    .execute();

  if (dbRes[0].count < 2) {return "0";}
  const averageBlockTime =
    (dbRes[0].lastTimestamp - dbRes[0].firstTimestamp) / (dbRes[0].count - 1);
  return Math.round(averageBlockTime).toString();
};
