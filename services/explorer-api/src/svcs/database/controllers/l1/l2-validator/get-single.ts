import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozValidatorWithSentinel,
  EthAddress,
  SentinelHistory,
} from "@chicmoz-pkg/types";
import { l1Schemas, sentinelSchemas } from "@chicmoz-pkg/database-registry";
import { and, desc, eq } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { getL2ChainInfo } from "../../l2/index.js";
import { logger } from "../../../../../logger.js";
import {
  buildLatestStakeSubquery,
  buildLatestStatusSubquery,
  buildValidatorSelect,
  mapRowToValidator,
  ValidatorRow,
} from "./util.js";

const { l1L2ValidatorTable } = l1Schemas;

const { SentinelHistoryTable } = sentinelSchemas;

type SingleValidatorOptions = {
  rollupAddress?: EthAddress;
  includeHistory?: boolean;
  historyLimit?: number;
  historyOffset?: number;
};

export async function getValidatorWithSentinel(
  attesterAddress: EthAddress,
  options: SingleValidatorOptions = {},
): Promise<ChicmozValidatorWithSentinel | null> {
  const { rollupAddress, includeHistory = true } = options;

  let targetRollupAddress = rollupAddress;
  if (!targetRollupAddress) {
    const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
    if (!chainInfo) {
      logger.error("Chain info not found");
      return null;
    }
    targetRollupAddress = chainInfo.l1ContractAddresses.rollupAddress;
  }

  const historyLimit = Math.max(1, Math.min(options.historyLimit ?? 100, 500));
  const historyOffset = Math.max(0, options.historyOffset ?? 0);

  return db().transaction(async (dbTx) => {
    const latestStatuses = buildLatestStatusSubquery(dbTx);
    const latestStakes = buildLatestStakeSubquery(dbTx);

    const rows = await buildValidatorSelect(dbTx, latestStatuses, latestStakes)
      .where(
        and(
          eq(l1L2ValidatorTable.attester, attesterAddress),
          eq(l1L2ValidatorTable.rollupAddress, targetRollupAddress),
        ),
      )
      .limit(1);

    if (!rows.length) {
      return null;
    }

    let history: SentinelHistory[] | undefined;
    if (includeHistory) {
      const historyRows = await dbTx
        .select({
          slot: SentinelHistoryTable.slot,
          status: SentinelHistoryTable.status,
        })
        .from(SentinelHistoryTable)
        .where(eq(SentinelHistoryTable.attester, attesterAddress))
        .orderBy(desc(SentinelHistoryTable.slot))
        .offset(historyOffset)
        .limit(historyLimit);

      history = historyRows;
    }

    return mapRowToValidator(rows[0] as ValidatorRow, history) ?? null;
  });
}
