import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, count, desc, eq, getTableColumns } from "drizzle-orm";
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

  for (const result of dbRes) {
    const txCount = await db()
      .select({ count: count() })
      .from(txEffect)
      .where(eq(txEffect.bodyId, result.bodyId))
      .execute();
    const finalizationStatus = await db()
      .select({
        status: getTableColumns(l2BlockFinalizationStatusTable).status,
      })
      .from(l2BlockFinalizationStatusTable)
      .where(eq(l2BlockFinalizationStatusTable.l2BlockHash, result.hash))
      .orderBy(
        desc(l2BlockFinalizationStatusTable.status),
        desc(l2BlockFinalizationStatusTable.l2BlockNumber),
      )
      .limit(1);

    let finalizationStatusValue = finalizationStatus[0]?.status;
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
  const joinQuery = db()
    .select({
      height: getTableColumns(l2Block).height,
      txHash: getTableColumns(txEffect).txHash,
      transactionFee: getTableColumns(txEffect).transactionFee,
      bodyId: body.id,
      timestamp: getTableColumns(globalVariables).timestamp,
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
          .where(getBlocksWhereRange({ from: args.from, to: args.to }))
          .orderBy(desc(l2Block.height), desc(txEffect.index))
          .limit(DB_MAX_TX_EFFECTS);
      } else {
        whereQuery = joinQuery
          .orderBy(desc(l2Block.height), desc(txEffect.index))
          .limit(DB_MAX_TX_EFFECTS);
      }
      break;
    case GetTypes.BlockHeight:
      whereQuery = joinQuery.where(and(eq(l2Block.height, args.blockHeight)));
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
