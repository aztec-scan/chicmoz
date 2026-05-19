import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, count, eq, gt, isNotNull, isNull, lt, or } from "drizzle-orm";
import {
  globalVariables,
  header,
  l2Block,
  l2ContractClassRegistered,
} from "../../../database/schema/index.js";
import { getCurrentRollupVersionNumber } from "../l2/chain-info/rollup-version-cache.js";

const getBaseFilters = async () => {
  const currentRollupVersion = await getCurrentRollupVersionNumber();
  return [
    isNull(l2Block.orphan_timestamp),
    currentRollupVersion !== null
      ? eq(l2Block.version, currentRollupVersion)
      : undefined,
  ] as const;
};

export const getTotalContracts = async (): Promise<number> => {
  const baseFilters = await getBaseFilters();
  const dbRes = await db()
    .select({ count: count() })
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2ContractClassRegistered.blockHash, l2Block.hash))
    .where(and(...baseFilters))
    .execute();
  return dbRes[0].count;
};

export const getVerifiedContractClassCount = async (): Promise<number> => {
  const baseFilters = await getBaseFilters();
  const dbRes = await db()
    .select({ count: count() })
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2ContractClassRegistered.blockHash, l2Block.hash))
    .where(
      and(
        ...baseFilters,
        or(
          isNotNull(l2ContractClassRegistered.artifactContractName),
          isNotNull(l2ContractClassRegistered.sourceCodeUrl),
        ),
      ),
    )
    .execute();
  return dbRes[0].count;
};

export const getProtocolContractClassCount = async (): Promise<number> => {
  const baseFilters = await getBaseFilters();
  const dbRes = await db()
    .select({ count: count() })
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2ContractClassRegistered.blockHash, l2Block.hash))
    .where(
      and(
        ...baseFilters,
        isNotNull(l2ContractClassRegistered.standardContractType),
      ),
    )
    .execute();
  return dbRes[0].count;
};

const ONE_DAY = 24 * 60 * 60 * 1000;

export const getTotalContractsLast24h = async (): Promise<number> => {
  const currentRollupVersion = await getCurrentRollupVersionNumber();
  const dbRes = await db()
    .select({ count: count() })
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2Block.hash, l2ContractClassRegistered.blockHash))
    .innerJoin(header, eq(header.blockHash, l2Block.hash))
    .innerJoin(globalVariables, eq(globalVariables.headerId, header.id))
    .where(
      and(
        gt(globalVariables.timestamp, Date.now() - ONE_DAY),
        lt(globalVariables.timestamp, Date.now()),
        isNull(l2Block.orphan_timestamp),
        currentRollupVersion !== null
          ? eq(l2Block.version, currentRollupVersion)
          : undefined,
      ),
    )
    .execute();
  return dbRes[0].count;
};
