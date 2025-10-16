import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { l1Schemas } from "@chicmoz-pkg/database-registry";
import {
  ChicmozL1L2ValidatorHistoryEntry,
  EthAddress,
  L1L2ValidatorStatus,
  chicmozL1L2ValidatorHistoryEntrySchema,
} from "@chicmoz-pkg/types";
import { desc, eq, sql } from "drizzle-orm";

const { l1L2ValidatorStatusTable } = l1Schemas;

export async function getL1L2ValidatorHistory(
  attesterAddress: EthAddress,
): Promise<ChicmozL1L2ValidatorHistoryEntry[]> {
  const result = await db()
    .select({
      timestamp: l1L2ValidatorStatusTable.timestamp,
      keyChanged: sql<string>`'status'`,
      newValue: sql<string>`CAST(${l1L2ValidatorStatusTable.status} AS TEXT)`,
    })
    .from(l1L2ValidatorStatusTable)
    .where(eq(l1L2ValidatorStatusTable.attesterAddress, attesterAddress))
    .orderBy(desc(sql`timestamp`));

  return result.map(({ timestamp, keyChanged, newValue }) =>
    chicmozL1L2ValidatorHistoryEntrySchema.parse([
      timestamp,
      keyChanged,
      keyChanged === "status"
        ? L1L2ValidatorStatus[
            newValue as keyof typeof L1L2ValidatorStatus
          ].toString()
        : newValue,
    ]),
  );
}
