import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { count, desc, eq, getTableColumns, inArray } from "drizzle-orm";
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

  // Initial query to get basic block information
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

  if (dbRes.length === 0) {
    return [];
  }

  // Collect bodyIds and blockHashes for bulk queries
  const bodyIds = dbRes.map((result) => result.bodyId);
  const blockHashes = dbRes.map((result) => result.hash);

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

  // Bulk query to get finalization statuses for all blocks
  const allStatuses = await db()
    .select({
      l2BlockHash: l2BlockFinalizationStatusTable.l2BlockHash,
      status: l2BlockFinalizationStatusTable.status,
      l2BlockNumber: l2BlockFinalizationStatusTable.l2BlockNumber,
    })
    .from(l2BlockFinalizationStatusTable)
    .where(inArray(l2BlockFinalizationStatusTable.l2BlockHash, blockHashes))
    .execute();

  // Group statuses by block hash
  const statusesByBlockHash = new Map<string, typeof allStatuses>();
  for (const status of allStatuses) {
    if (!statusesByBlockHash.has(status.l2BlockHash)) {
      statusesByBlockHash.set(status.l2BlockHash, []);
    }
    statusesByBlockHash.get(status.l2BlockHash)!.push(status);
  }

  // For each block hash, find the status with the highest value
  const statusMap = new Map<string, number>();
  for (const blockHash of blockHashes) {
    const blockStatuses = statusesByBlockHash.get(blockHash) ?? [];
    // Sort by status (desc) and then by l2BlockNumber (desc)
    blockStatuses.sort((a, b) => {
      if (a.status !== b.status) {
        return b.status - a.status; // Descending by status
      }
      return Number(b.l2BlockNumber) - Number(a.l2BlockNumber); // Descending by l2BlockNumber
    });
    // Take the first one (highest status, highest block number) if available
    if (blockStatuses.length > 0) {
      statusMap.set(blockHash, blockStatuses[0].status);
    }
  }

  // Build the final blocks array using the maps for lookup
  const blocks: UiBlockTable[] = [];
  for (const result of dbRes) {
    let finalizationStatusValue = statusMap.get(result.hash);
    if (finalizationStatusValue === undefined) {
      finalizationStatusValue = FIRST_FINALIZATION_STATUS;
      logger.warn(`Finalization status not found for block ${result.hash}`);
    }

    const blockData = {
      blockHash: result.hash,
      height: result.height,
      blockStatus: finalizationStatusValue,
      timestamp: result.timestamp,
      txEffectsLength: txCountMap.get(result.bodyId) ?? 0,
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
