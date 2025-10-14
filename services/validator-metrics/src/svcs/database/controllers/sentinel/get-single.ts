import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  EthAddress,
  SentinelHistory,
  SentinelValidatorStats,
  sentinelValidatorStatsSchema,
} from "@chicmoz-pkg/types";
import { eq, desc } from "drizzle-orm";
import { sentinelSchemas } from "@chicmoz-pkg/database-registry";

const {
  SentinelHistoryTable,
  SentinelBlockTable,
  SentinelAttestationTable,
  SentinelValidatorTable,
} = sentinelSchemas;

export async function getSentinelValidatorStats(
  attesterAddress: EthAddress,
  historyOpts?: {
    limit: number;
    offset: number;
  },
): Promise<SentinelValidatorStats | null> {
  return db().transaction(async (dbTx) => {
    const validator = await dbTx
      .select({
        validator: {
          attester: SentinelValidatorTable.attester,
          lastSeenAt: SentinelValidatorTable.lastSeenAt,
          lastSeenAtSlot: SentinelValidatorTable.lastSeenAtSlot,
          totalSlots: SentinelValidatorTable.totalSlots,
        },
        blocks: {
          total: SentinelBlockTable.total,
          missed: SentinelBlockTable.missed,
          lastSeenAt: SentinelBlockTable.lastSeenAt,
          lastSeenAtSlot: SentinelBlockTable.lastSeenAtSlot,
        },
        attestations: {
          total: SentinelAttestationTable.total,
          missed: SentinelAttestationTable.missed,
          lastSeenAt: SentinelAttestationTable.lastSeenAt,
          lastSeenAtSlot: SentinelAttestationTable.lastSeenAtSlot,
        },
      })
      .from(SentinelValidatorTable)
      .leftJoin(
        SentinelBlockTable,
        eq(SentinelBlockTable.attester, SentinelValidatorTable.attester),
      )
      .leftJoin(
        SentinelAttestationTable,
        eq(SentinelAttestationTable.attester, SentinelValidatorTable.attester),
      )
      .where(eq(SentinelValidatorTable.attester, attesterAddress))
      .then((rows) => rows[0] ?? null);

    let historyArray: SentinelHistory[] = [];

    if (historyOpts) {
      historyArray = await dbTx
        .select()
        .from(SentinelHistoryTable)
        .where(eq(SentinelHistoryTable.attester, attesterAddress))
        .orderBy(desc(SentinelHistoryTable.slot))
        .offset(historyOpts.offset)
        .limit(historyOpts.limit);
    }

    return sentinelValidatorStatsSchema.parse({
      ...validator.validator,
      blocks: validator.blocks,
      attestations: validator.attestations,
      history: historyArray,
    });
  });
}
