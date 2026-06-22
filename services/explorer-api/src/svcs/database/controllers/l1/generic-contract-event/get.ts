import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL1ContractEventsHourlyCounts,
  ChicmozL1GenericContractEvent,
  chicmozL1ContractEventsHourlyCountsSchema,
  chicmozL1GenericContractEventSchema,
} from "@chicmoz-pkg/types";
import { count, desc, getTableColumns, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { l1GenericContractEventTable } from "../../../schema/l1/generic-contract-event.js";

const LIMIT = 1000;

export async function get(): Promise<ChicmozL1GenericContractEvent[]> {
  const res = await db()
    .select(getTableColumns(l1GenericContractEventTable))
    .from(l1GenericContractEventTable)
    .orderBy(desc(l1GenericContractEventTable.l1BlockNumber))
    .limit(LIMIT);
  return z.array(chicmozL1GenericContractEventSchema).parse(res);
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Per-hour event-count buckets over the last `hours` hours. Buckets with zero
 * events are NOT returned — the caller fills them in. Bucket key is the
 * unix-ms timestamp of the hour boundary (floor(ts / HOUR_MS) * HOUR_MS).
 */
export async function getHourlyCounts(
  hours: number,
): Promise<ChicmozL1ContractEventsHourlyCounts> {
  const cutoff = Date.now() - hours * HOUR_MS;
  const hourMs = sql.raw(String(HOUR_MS));
  const bucketExpr = sql<number>`floor(${l1GenericContractEventTable.l1BlockTimestamp}::numeric / ${hourMs})::bigint * ${hourMs}`;
  const res = await db()
    .select({
      hourStartMs: bucketExpr,
      count: count(),
    })
    .from(l1GenericContractEventTable)
    .where(gte(l1GenericContractEventTable.l1BlockTimestamp, cutoff))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return chicmozL1ContractEventsHourlyCountsSchema.parse(res);
}
