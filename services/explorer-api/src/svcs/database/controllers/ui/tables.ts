import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { count, desc, eq, getTableColumns } from "drizzle-orm";
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
  FIRST_FINALIZATION_STATUS,
  UiBlockTable,
  uiBlockTableSchema,
  UiTxEffectTable,
  uiTxEffectTableSchema,
} from "@chicmoz-pkg/types";
import { l2BlockFinalizationStatusTable } from "../../schema/l2block/finalization-status.js";
import { logger } from "../../../../logger.js";

type GetBlocksByRange = {
  from: bigint | undefined;
  to: bigint | undefined;
};

export const getBlocksForUiTable = async ({
  from,
  to,
}: GetBlocksByRange): Promise<UiBlockTable[]> => {
  const whereRange = getBlocksWhereRange({ from, to });

  const dbRes = await db()
    .select({
      height: getTableColumns(l2Block).height,
      hash: getTableColumns(l2Block).hash,
      timestamp: getTableColumns(globalVariables).timestamp,
      bodyId: body.id,
    })
    .from(l2Block)
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .innerJoin(body, eq(body.blockHash, l2Block.hash))
    .where(whereRange)
    .orderBy(desc(l2Block.height))
    .limit(DB_MAX_BLOCKS)
    .execute();

  const blocks: UiBlockTable[] = [];

  // Fetch transaction counts in bulk
  const txCounts = await db()
    .select({
      bodyId: txEffect.bodyId,
      count: count(),
    })
    .from(txEffect)
    .where(
      txEffect.bodyId.in(dbRes.map((result) => result.bodyId))
    )
    .groupBy(txEffect.bodyId)
    .execute();
  const txCountMap = new Map(txCounts.map((row) => [row.bodyId, row.count]));

  // Fetch finalization statuses in bulk
  const finalizationStatuses = await db()
    .select({
      hash: l2BlockFinalizationStatusTable.l2BlockHash,
      status: getTableColumns(l2BlockFinalizationStatusTable).status,
    })
    .from(l2BlockFinalizationStatusTable)
    .where(
      l2BlockFinalizationStatusTable.l2BlockHash.in(dbRes.map((result) => result.hash))
    )
    .orderBy(
      desc(l2BlockFinalizationStatusTable.status),
      desc(l2BlockFinalizationStatusTable.l2BlockNumber),
    )
    .execute();
  const finalizationStatusMap = new Map(
    finalizationStatuses.map((row) => [row.hash, row.status])
  );

  for (const result of dbRes) {
    const txCount = txCountMap.get(result.bodyId) || 0;
    let finalizationStatusValue = finalizationStatusMap.get(result.hash);
    if (finalizationStatusValue === undefined) {
      finalizationStatusValue = FIRST_FINALIZATION_STATUS;
      logger.warn(`Finalization status not found for block ${result.hash}`);
    }

    const blockData = {
      blockHash: result.hash,
      height: result.height,
      blockStatus: finalizationStatusValue,
      timestamp: result.timestamp,
      txEffectsLength: txCount[0].count,
    };
    blocks.push(await uiBlockTableSchema.parseAsync(blockData));
  }
  return blocks;
};

export const getTxEffectForUiTable = async ({
  from,
  to,
}: GetBlocksByRange): Promise<UiTxEffectTable[]> => {
  const whereRange = getBlocksWhereRange({ from, to });

  const dbRes = await db()
    .select({
      height: getTableColumns(l2Block).height,
      txHash: getTableColumns(txEffect).txHash,
      transactionFee: getTableColumns(txEffect).transactionFee,
      bodyId: body.id,
      timestamp: getTableColumns(txEffect).txBirthTimestamp,
    })
    .from(l2Block)
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(body, eq(body.blockHash, l2Block.hash))
    .innerJoin(txEffect, eq(txEffect.bodyId, body.id))
    .where(whereRange)
    .orderBy(desc(l2Block.height), desc(txEffect.index))
    .limit(DB_MAX_TX_EFFECTS)
    .execute();

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
