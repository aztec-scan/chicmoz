import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import {
  body,
  globalVariables,
  header,
  l2Block,
  txEffect,
} from "../../../database/schema/index.js";
import { getBlocksWhereRange } from "../utils.js";
import { DB_MAX_BLOCKS, DB_MAX_TX_EFFECTS } from "../../../../environment.js";
import {
  type UiBlockTable,
  type UiBlockStatusFilter,
  uiBlockTableSchema,
  type UiTxEffectTable,
  uiTxEffectTableSchema,
} from "@chicmoz-pkg/types";
import { getCurrentRollupVersionNumber } from "../l2/chain-info/rollup-version-cache.js";
import { deriveNativeStatus, getTips } from "../l2/tips.js";

type GetBlocksByRange = {
  from: bigint | undefined;
  to: bigint | undefined;
  status?: UiBlockStatusFilter;
};

const statusFilterWhere = (
  status: Exclude<UiBlockStatusFilter, "orphaned">,
  l2Tips: Awaited<ReturnType<typeof getTips>>,
) => {
  if (!l2Tips || l2Tips.degradedReason) {
    return status === "unknown" ? isNull(l2Block.orphan_timestamp) : sql`false`;
  }

  const finalizedHeight = BigInt(l2Tips.finalized.block.number);
  const provenHeight = BigInt(l2Tips.proven.block.number);
  const checkpointedHeight = BigInt(l2Tips.checkpointed.block.number);
  const proposedHeight = BigInt(l2Tips.proposed.number);

  switch (status) {
    case "proposed":
      return and(
        isNull(l2Block.orphan_timestamp),
        gt(l2Block.height, checkpointedHeight),
        lte(l2Block.height, proposedHeight),
      );
    case "checkpointed":
      return and(
        isNull(l2Block.orphan_timestamp),
        gt(l2Block.height, provenHeight),
        lte(l2Block.height, checkpointedHeight),
      );
    case "proven":
      return and(
        isNull(l2Block.orphan_timestamp),
        gt(l2Block.height, finalizedHeight),
        lte(l2Block.height, provenHeight),
      );
    case "finalized":
      return and(
        isNull(l2Block.orphan_timestamp),
        lte(l2Block.height, finalizedHeight),
      );
    case "unknown":
      return and(
        isNull(l2Block.orphan_timestamp),
        gt(l2Block.height, proposedHeight),
      );
  }
};

export const getBlocksForUiTable = async ({
  from,
  to,
  status,
}: GetBlocksByRange): Promise<UiBlockTable[]> => {
  const whereRange = getBlocksWhereRange({ from, to });

  const rollupVersion = await getCurrentRollupVersionNumber();
  const l2Tips = await getTips();
  const versionFilter =
    rollupVersion !== null ? eq(l2Block.version, rollupVersion) : undefined;

  const statusWhere =
    status === "orphaned"
      ? isNotNull(l2Block.orphan_timestamp)
      : status
        ? statusFilterWhere(status, l2Tips)
        : undefined;

  // Initial query to get basic block information. Orphans are intentionally
  // included when unfiltered so the UI can render an "orphaned" pill.
  const dbRes = await db()
    .select({
      height: getTableColumns(l2Block).height,
      hash: getTableColumns(l2Block).hash,
      timestamp: getTableColumns(globalVariables).timestamp,
      coinbase: getTableColumns(globalVariables).coinbase,
      orphanTimestamp: getTableColumns(l2Block).orphan_timestamp,
      bodyId: body.id,
    })
    .from(l2Block)
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .innerJoin(body, eq(body.blockHash, l2Block.hash))
    .where(and(whereRange, versionFilter, statusWhere))
    .orderBy(desc(l2Block.height))
    .limit(DB_MAX_BLOCKS)
    .execute();

  if (dbRes.length === 0) {
    return [];
  }

  // Collect bodyIds for bulk queries.
  const bodyIds = dbRes.map((result) => result.bodyId);

  // Bulk query to get transaction counts for all blocks at once
  const txCounts = await db()
    .select({
      bodyId: txEffect.bodyId,
      count: count(),
    })
    .from(txEffect)
    .where(inArray(txEffect.bodyId, bodyIds))
    .groupBy(txEffect.bodyId)
    .execute();

  // Create a map for quick lookup of tx counts by bodyId
  const txCountMap = new Map(txCounts.map((item) => [item.bodyId, item.count]));

  // Build the final blocks array using the maps for lookup
  const blocks: UiBlockTable[] = [];
  for (const result of dbRes) {
    const blockData = {
      blockHash: result.hash,
      height: result.height,
      nativeStatus: deriveNativeStatus(
        {
          height: result.height,
          hash: result.hash,
          orphan:
            result.orphanTimestamp != null
              ? { timestamp: result.orphanTimestamp, hasOrphanedParent: false }
              : undefined,
        },
        l2Tips,
      ),
      timestamp: result.timestamp,
      txEffectsLength: txCountMap.get(result.bodyId) ?? 0,
      orphan: result.orphanTimestamp != null,
      coinbase: result.coinbase,
    };
    blocks.push(await uiBlockTableSchema.parseAsync(blockData));
  }
  return blocks;
};

enum GetTypes {
  BlockHeightRange,
  BlockHeight,
}

type GetTableTxEffectByBlockHeight = {
  blockHeight: bigint;
  getType: GetTypes.BlockHeight;
};

type GetTableTxEffectsByBlockHeightRange = {
  from?: bigint;
  to?: bigint;
  getType: GetTypes.BlockHeightRange;
};

export const getTxEffectForUiTable = async (
  args: GetTableTxEffectByBlockHeight | GetTableTxEffectsByBlockHeightRange,
): Promise<UiTxEffectTable[]> => {
  const rollupVersion = await getCurrentRollupVersionNumber();
  const versionFilter =
    rollupVersion !== null ? eq(l2Block.version, rollupVersion) : undefined;

  const joinQuery = db()
    .select({
      height: getTableColumns(l2Block).height,
      txHash: getTableColumns(txEffect).txHash,
      transactionFee: getTableColumns(txEffect).transactionFee,
      bodyId: body.id,
      timestamp: getTableColumns(txEffect).txBirthTimestamp,
    })
    .from(l2Block)
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .innerJoin(body, eq(body.blockHash, l2Block.hash))
    .innerJoin(txEffect, eq(txEffect.bodyId, body.id));

  let whereQuery;

  switch (args.getType) {
    case GetTypes.BlockHeightRange:
      if (args.from ?? args.to) {
        whereQuery = joinQuery
          .where(
            and(
              getBlocksWhereRange({ from: args.from, to: args.to }),
              isNull(l2Block.orphan_timestamp),
              versionFilter,
            ),
          )
          .orderBy(desc(l2Block.height), desc(txEffect.index))
          .limit(DB_MAX_TX_EFFECTS);
      } else {
        whereQuery = joinQuery
          .where(and(isNull(l2Block.orphan_timestamp), versionFilter))
          .orderBy(desc(l2Block.height), desc(txEffect.index))
          .limit(DB_MAX_TX_EFFECTS);
      }
      break;
    case GetTypes.BlockHeight:
      whereQuery = joinQuery.where(
        and(eq(l2Block.height, args.blockHeight), versionFilter),
      );
      break;
  }

  const dbRes = await whereQuery.execute();
  const txEffects: UiTxEffectTable[] = [];

  for (const result of dbRes) {
    const txEffectData = {
      blockNumber: result.height,
      txHash: result.txHash,
      transactionFee: result.transactionFee,
      timestamp: result.timestamp,
    };
    txEffects.push(await uiTxEffectTableSchema.parseAsync(txEffectData));
  }
  return txEffects;
};
