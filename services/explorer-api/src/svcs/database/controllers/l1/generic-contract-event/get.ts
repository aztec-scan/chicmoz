import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL1GenericContractEvent,
  chicmozL1GenericContractEventSchema,
} from "@chicmoz-pkg/types";
import { desc, getTableColumns } from "drizzle-orm";
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
