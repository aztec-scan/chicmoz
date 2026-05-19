import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  chicmozL2ContractClassRegisteredEventSchema,
  type ChicmozL2ContractClassRegisteredEvent,
} from "@chicmoz-pkg/types";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { DB_MAX_CONTRACTS } from "../../../../environment.js";
import { l2Block } from "../../schema/index.js";
import { l2ContractClassRegistered } from "../../schema/l2contract/index.js";
import { getCurrentRollupVersionNumber } from "../l2/chain-info/rollup-version-cache.js";
import { getContractClassRegisteredColumns } from "./utils.js";
import { z } from "zod";

export const getL2RegisteredContractClass = async (
  contractClassId: ChicmozL2ContractClassRegisteredEvent["contractClassId"],
  version: ChicmozL2ContractClassRegisteredEvent["version"],
  includeArtifactJson?: boolean,
): Promise<ChicmozL2ContractClassRegisteredEvent | null> => {
  const res = await getL2RegisteredContractClasses({
    contractClassId,
    version,
    includeArtifactJson,
  });
  return res.length > 0 ? res[0] : null;
};

export const getL2RegisteredContractClasses = async ({
  contractClassId,
  version,
  includeArtifactJson,
  verifiedSourceOnly,
  offset,
  limit,
  verified,
  protocol,
}: {
  contractClassId?: ChicmozL2ContractClassRegisteredEvent["contractClassId"];
  version?: ChicmozL2ContractClassRegisteredEvent["version"];
  includeArtifactJson?: boolean;
  verifiedSourceOnly?: boolean;
  offset?: number;
  limit?: number;
  verified?: boolean;
  protocol?: boolean;
}): Promise<Array<ChicmozL2ContractClassRegisteredEvent>> => {
  if (contractClassId === undefined && version !== undefined) {
    throw new Error("Specifying version but not classId is not allowed");
  }
  if (contractClassId === undefined) {
    return getLatestL2RegisteredContractClasses({
      verifiedSourceOnly,
      offset,
      limit,
      verified,
      protocol,
    });
  }
  const whereQuery = version
    ? and(
        eq(l2ContractClassRegistered.contractClassId, contractClassId),
        eq(l2ContractClassRegistered.version, version),
      )
    : eq(l2ContractClassRegistered.contractClassId, contractClassId);
  const resultLimit = version ? 1 : DB_MAX_CONTRACTS;

  const result = await db()
    .select(getContractClassRegisteredColumns(includeArtifactJson))
    .from(l2ContractClassRegistered)
    .where(whereQuery)
    .limit(resultLimit)
    .orderBy(desc(l2ContractClassRegistered.version));

  return z.array(chicmozL2ContractClassRegisteredEventSchema).parse(result);
};

export const getLatestL2RegisteredContractClasses = async ({
  verifiedSourceOnly,
  offset,
  limit,
  verified,
  protocol,
}: {
  verifiedSourceOnly?: boolean;
  offset?: number;
  limit?: number;
  verified?: boolean;
  protocol?: boolean;
} = {}): Promise<Array<ChicmozL2ContractClassRegisteredEvent>> => {
  const currentRollupVersion = await getCurrentRollupVersionNumber();
  const filters = [
    isNull(l2Block.orphan_timestamp),
    currentRollupVersion !== null
      ? eq(l2Block.version, currentRollupVersion)
      : undefined,
  ];

  if (verifiedSourceOnly) {
    filters.push(isNotNull(l2ContractClassRegistered.sourceCodeUrl));
  }
  if (verified) {
    filters.push(isNotNull(l2ContractClassRegistered.artifactContractName));
  }
  if (protocol) {
    filters.push(isNotNull(l2ContractClassRegistered.standardContractType));
  }

  const selectColumns = {
    blockHash: l2ContractClassRegistered.blockHash,
    contractClassId: l2ContractClassRegistered.contractClassId,
    version: l2ContractClassRegistered.version,
    artifactHash: l2ContractClassRegistered.artifactHash,
    privateFunctionsRoot: l2ContractClassRegistered.privateFunctionsRoot,
    packedBytecode: l2ContractClassRegistered.packedBytecode,
    artifactContractName: l2ContractClassRegistered.artifactContractName,
    standardContractType: l2ContractClassRegistered.standardContractType,
    standardContractVersion: l2ContractClassRegistered.standardContractVersion,
    sourceCodeUrl: l2ContractClassRegistered.sourceCodeUrl,
  };

  // selectColumnsWithHeight is only used internally for sorting; the height
  // column is dropped before Zod parsing so it never reaches the response.
  const selectColumnsWithHeight = {
    ...selectColumns,
    blockHeight: l2Block.height,
  };

  const baseQuery = db()
    .select(selectColumns)
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2Block.hash, l2ContractClassRegistered.blockHash))
    .where(and(...filters));

  // When offset/limit are provided, use simple paginated query (no merge).
  if (offset !== undefined || limit !== undefined) {
    const queryLimit = limit ?? DB_MAX_CONTRACTS;
    const result = await baseQuery
      .orderBy(desc(l2Block.height))
      .limit(queryLimit)
      .offset(offset ?? 0);
    return result.map((r) =>
      chicmozL2ContractClassRegisteredEventSchema.parse(r),
    );
  }

  if (verifiedSourceOnly) {
    const result = await baseQuery.orderBy(
      desc(l2ContractClassRegistered.version),
      desc(l2Block.height),
    );
    return result.map((r) =>
      chicmozL2ContractClassRegisteredEventSchema.parse(r),
    );
  }

  // Fetch verified classes (those with artifact or source) without a height
  // limit so they always appear in the VERIFIED filter, even if they're not
  // among the most recent blocks.
  const verifiedFilters = [
    ...filters,
    isNotNull(l2ContractClassRegistered.artifactContractName),
  ];
  const verifiedResult = await db()
    .select(selectColumnsWithHeight)
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2Block.hash, l2ContractClassRegistered.blockHash))
    .where(and(...verifiedFilters));

  // Fetch the most recent classes (with height limit) for the main listing.
  const recentResult = await db()
    .select(selectColumnsWithHeight)
    .from(l2ContractClassRegistered)
    .innerJoin(l2Block, eq(l2Block.hash, l2ContractClassRegistered.blockHash))
    .where(and(...filters))
    .orderBy(desc(l2Block.height))
    .limit(DB_MAX_CONTRACTS);

  // Merge, deduplicating by contractClassId, then sort by block height
  // descending so the list is always ordered by recency.
  const seen = new Set(verifiedResult.map((c) => c.contractClassId));
  const merged = [
    ...verifiedResult,
    ...recentResult.filter((c) => !seen.has(c.contractClassId)),
  ].sort((a, b) => {
    const aHeight =
      typeof a.blockHeight === "bigint"
        ? a.blockHeight
        : BigInt(a.blockHeight ?? 0);
    const bHeight =
      typeof b.blockHeight === "bigint"
        ? b.blockHeight
        : BigInt(b.blockHeight ?? 0);
    return bHeight > aHeight ? 1 : bHeight < aHeight ? -1 : 0;
  });

  return merged.map(({ blockHeight: _, ...r }) =>
    chicmozL2ContractClassRegisteredEventSchema.parse(r),
  );
};
