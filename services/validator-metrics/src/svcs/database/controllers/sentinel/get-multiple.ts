import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { SentinelValidatorStats, sentinelValidatorStatsSchema, SentinelFilterEnum } from "@chicmoz-pkg/types";

import {
  SentinelBlockTable,
  SentinelAttestationTable,
  SentinelValidatorTable,
} from "../../schema/sentinel/index.js"
import { eq, desc, asc } from "drizzle-orm";

function pickFilter(filter?: SentinelFilterEnum){
  switch (filter) {
    case "asc-slots":
      return asc(SentinelValidatorTable.totalSlots)
    case "desc-slots":
      return desc(SentinelValidatorTable.totalSlots)
    case "asc-latest":
      return asc(SentinelValidatorTable.lastSeenAtSlot)
    case "desc-latest":
    default:
      return desc(SentinelValidatorTable.lastSeenAtSlot)
  }
}

export async function filterSentinelValidatorStatsPaginated(
  offset = 0,
  limit = 50,
  filter?: SentinelFilterEnum
): Promise <SentinelValidatorStats[] | null> {
  const pageLimit = Math.max(1, Math.min(limit, 500));
  const pickedFilter = pickFilter(filter)

  return db().transaction(async (dbTx)=> {
      const validators = await dbTx.select({
        validator: {
          attester: SentinelValidatorTable.attester,
          lastSeenAt: SentinelValidatorTable.lastSeenAt,
          lastSeenAtSlot: SentinelValidatorTable.lastSeenAtSlot,
          totalSlots: SentinelValidatorTable.totalSlots,
        },
        blocks: { total: SentinelBlockTable.total, missed: SentinelBlockTable.missed },
        attestations: { total: SentinelAttestationTable.total, missed: SentinelAttestationTable.missed },
      })
      .from(SentinelValidatorTable)
      .leftJoin(SentinelBlockTable, eq(SentinelBlockTable.attester, SentinelValidatorTable.attester))
      .leftJoin(SentinelAttestationTable, eq(SentinelAttestationTable.attester, SentinelValidatorTable.attester))
      .orderBy(pickedFilter)
      .limit(pageLimit)
      .offset(offset)
      
      return validators.map((validator)=> sentinelValidatorStatsSchema.parse({...validator.validator, blocks: validator.blocks, attestations: validator.attestations, history:[]}))
    })
}