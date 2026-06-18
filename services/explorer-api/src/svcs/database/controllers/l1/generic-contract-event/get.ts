import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL1ContractEventsHourlyCounts,
  ChicmozL1GenericContractEvent,
  chicmozL1ContractEventsHourlyCountsSchema,
  chicmozL1GenericContractEventSchema,
} from "@chicmoz-pkg/types";
import { and, count, desc, getTableColumns, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { l1GenericContractEventTable } from "../../../schema/l1/generic-contract-event.js";
import { getL2ChainInfo } from "../../l2/index.js";

const LIMIT = 1000;

async function getCurrentL1ContractAddresses(): Promise<string[] | null> {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
  if (!chainInfo) {
    return null;
  }

  return Object.values(chainInfo.l1ContractAddresses).map((address) =>
    address.toLowerCase(),
  );
}

export async function get(): Promise<ChicmozL1GenericContractEvent[]> {
  const currentL1ContractAddresses = await getCurrentL1ContractAddresses();
  const baseQuery = db()
    .select(getTableColumns(l1GenericContractEventTable))
    .from(l1GenericContractEventTable);

  const res = currentL1ContractAddresses
    ? await baseQuery
        .where(
          inArray(
            l1GenericContractEventTable.l1ContractAddress,
            currentL1ContractAddresses,
          ),
        )
        .orderBy(desc(l1GenericContractEventTable.l1BlockNumber))
        .limit(LIMIT)
    : await baseQuery
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
  const currentL1ContractAddresses = await getCurrentL1ContractAddresses();
  const cutoffFilter = gte(l1GenericContractEventTable.l1BlockTimestamp, cutoff);
  const currentContractFilter = currentL1ContractAddresses
    ? inArray(
        l1GenericContractEventTable.l1ContractAddress,
        currentL1ContractAddresses,
      )
    : undefined;

  const res = await db()
    .select({
      hourStartMs: bucketExpr,
      count: count(),
    })
    .from(l1GenericContractEventTable)
    .where(
      currentContractFilter
        ? and(cutoffFilter, currentContractFilter)
        : cutoffFilter,
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return chicmozL1ContractEventsHourlyCountsSchema.parse(res);
}
