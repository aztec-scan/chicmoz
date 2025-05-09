import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2BlockLight,
  FIRST_FINALIZATION_STATUS,
  HexString,
  chicmozL2BlockLightSchema,
} from "@chicmoz-pkg/types";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { DB_MAX_BLOCKS } from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import {
  archive,
  body,
  contentCommitment,
  gasFees,
  globalVariables,
  header,
  l1L2BlockProposedTable,
  l1L2ProofVerifiedTable,
  l1ToL2MessageTree,
  l2Block,
  lastArchive,
  noteHashTree,
  nullifierTree,
  partial,
  publicDataTree,
  state,
  txEffect,
} from "../../../database/schema/l2block/index.js";
import { l2BlockFinalizationStatusTable } from "../../schema/l2block/finalization-status.js";
import { getBlocksWhereRange, getTableColumnsWithoutId } from "../utils.js";

enum GetTypes {
  BlockHeight,
  BlockHash,
  Range,
}

type GetBlocksByHeight = {
  height: bigint;
  getType: GetTypes.BlockHeight;
};

type GetBlocksByHash = {
  hash: HexString;
  getType: GetTypes.BlockHash;
};

type GetBlocksByRange = {
  from: bigint | undefined;
  to: bigint | undefined;
  getType: GetTypes.Range;
};

/**
 * Options for retrieving blocks
 */
export interface BlockQueryOptions {
  /**
   * Whether to include orphaned blocks
   * @default false
   */
  includeOrphaned?: boolean;
}

export const getBlocks = async (
  {
    from,
    to,
  }: {
    from: bigint | undefined;
    to: bigint | undefined;
  },
  options: BlockQueryOptions = {},
): Promise<ChicmozL2BlockLight[]> => {
  return _getBlocks({ from, to, getType: GetTypes.Range }, options);
};

export const getBlock = async (
  heightOrHash: bigint | HexString,
  options: BlockQueryOptions = {},
): Promise<ChicmozL2BlockLight | null> => {
  const res = await _getBlocks(
    typeof heightOrHash === "bigint"
      ? { height: heightOrHash, getType: GetTypes.BlockHeight }
      : { hash: heightOrHash, getType: GetTypes.BlockHash },
    options,
  );
  if (res.length === 0) {
    return null;
  }
  return res[0];
};

/**
 * Get one block for each finalization status
 * @param options Options for retrieving blocks
 * @returns Array of blocks, one for each distinct finalization status
 */
export const getBlocksByFinalizationStatus = async (
  options: BlockQueryOptions = {},
): Promise<ChicmozL2BlockLight[]> => {
  // Get distinct finalization statuses
  const distinctStatuses = await db()
    .selectDistinct({
      status: l2BlockFinalizationStatusTable.status,
    })
    .from(l2BlockFinalizationStatusTable);

  // For each status, get the block with the highest block number
  const blocks: ChicmozL2BlockLight[] = [];

  for (const { status } of distinctStatuses) {
    // Get the block with the highest block number for this status
    const { includeOrphaned = false } = options;

    const query = db()
      .select({
        blockHash: l2BlockFinalizationStatusTable.l2BlockHash,
      })
      .from(l2BlockFinalizationStatusTable)
      .innerJoin(
        l2Block,
        eq(l2BlockFinalizationStatusTable.l2BlockHash, l2Block.hash),
      )
      .where(
        includeOrphaned
          ? eq(l2BlockFinalizationStatusTable.status, status)
          : and(
              eq(l2BlockFinalizationStatusTable.status, status),
              isNull(l2Block.orphan_timestamp),
            ),
      );

    const latestBlockForStatus = await query
      .orderBy(desc(l2BlockFinalizationStatusTable.l2BlockNumber))
      .limit(1); // Only get one block per status

    if (latestBlockForStatus.length > 0) {
      const blockHash = latestBlockForStatus[0].blockHash;
      const block = await getBlock(blockHash, options);
      if (block) {
        blocks.push(block);
      }
    }
  }

  return blocks;
};

type GetBlocksArgs = GetBlocksByHeight | GetBlocksByHash | GetBlocksByRange;

const _getBlocks = async (
  args: GetBlocksArgs,
  options: BlockQueryOptions = {},
): Promise<ChicmozL2BlockLight[]> => {
  const { includeOrphaned = false } = options;
  const whereRange =
    args.getType === GetTypes.Range ? getBlocksWhereRange(args) : undefined;

  if (args.getType === GetTypes.BlockHeight) {
    if (args.height < -1) {
      throw new Error("Invalid height");
    }
  }

  const finalizationStatusSubquery = db()
    .select({
      l2BlockHash: l2BlockFinalizationStatusTable.l2BlockHash,
      status: l2BlockFinalizationStatusTable.status,
      rowNumber:
        sql`ROW_NUMBER() OVER (PARTITION BY ${l2BlockFinalizationStatusTable.l2BlockHash} 
      ORDER BY ${l2BlockFinalizationStatusTable.status} DESC, 
      ${l2BlockFinalizationStatusTable.l2BlockNumber} DESC)`.as("row_number"),
    })
    .from(l2BlockFinalizationStatusTable)
    .as("latest_status");

  const txEffectsSubquery = db()
    .select({
      bodyId: txEffect.bodyId,
      txHashes:
        sql`json_agg(${txEffect.txHash} ORDER BY ${txEffect.index} ASC)`.as(
          "tx_hashes",
        ),
    })
    .from(txEffect)
    .groupBy(txEffect.bodyId)
    .as("txEffectsAgg");
  const joinQuery = db()
    .select({
      ...getTableColumns(l2Block),
      archive: getTableColumnsWithoutId(archive),
      l1L2BlockProposed: getTableColumnsWithoutId(l1L2BlockProposedTable),
      l1L2ProofVerified: getTableColumnsWithoutId(l1L2ProofVerifiedTable),
      header_LastArchive: getTableColumnsWithoutId(lastArchive),
      header_TotalFees: header.totalFees,
      header_TotalManaUsed: header.totalManaUsed,
      header_ContentCommitment: getTableColumnsWithoutId(contentCommitment),
      header_State_L1ToL2MessageTree:
        getTableColumnsWithoutId(l1ToL2MessageTree),
      header_State_Partial_NoteHashTree: getTableColumnsWithoutId(noteHashTree),
      header_State_Partial_NullifierTree:
        getTableColumnsWithoutId(nullifierTree),
      headerState_Partial_PublicDataTree:
        getTableColumnsWithoutId(publicDataTree),
      header_GlobalVariables: getTableColumnsWithoutId(globalVariables),
      header_GlobalVariables_GasFees: getTableColumnsWithoutId(gasFees),
      bodyId: body.id,
      finalizationStatus: finalizationStatusSubquery.status,
      txEffects: txEffectsSubquery.txHashes,
    })
    .from(l2Block)
    .innerJoin(archive, eq(l2Block.hash, archive.fk))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(lastArchive, eq(header.id, lastArchive.fk))
    .innerJoin(contentCommitment, eq(header.id, contentCommitment.headerId))
    .innerJoin(state, eq(header.id, state.headerId))
    .innerJoin(l1ToL2MessageTree, eq(state.id, l1ToL2MessageTree.fk))
    .innerJoin(partial, eq(state.id, partial.stateId))
    .innerJoin(noteHashTree, eq(partial.id, noteHashTree.fk))
    .innerJoin(nullifierTree, eq(partial.id, nullifierTree.fk))
    .innerJoin(publicDataTree, eq(partial.id, publicDataTree.fk))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .innerJoin(gasFees, eq(globalVariables.id, gasFees.globalVariablesId))
    .innerJoin(body, eq(l2Block.hash, body.blockHash))
    .leftJoin(
      l1L2BlockProposedTable,
      and(
        eq(l2Block.height, l1L2BlockProposedTable.l2BlockNumber),
        eq(archive.root, l1L2BlockProposedTable.archive),
      ),
    )
    .leftJoin(
      l1L2ProofVerifiedTable,
      eq(l2Block.height, l1L2ProofVerifiedTable.l2BlockNumber),
    )
    .leftJoin(
      finalizationStatusSubquery,
      and(
        eq(finalizationStatusSubquery.l2BlockHash, l2Block.hash),
        eq(finalizationStatusSubquery.rowNumber, 1),
      ),
    )
    .leftJoin(txEffectsSubquery, eq(txEffectsSubquery.bodyId, body.id));

  let whereQuery;

  switch (args.getType) {
    case GetTypes.BlockHeight:
      if (args.height === -1n) {
        // Get latest block
        whereQuery = joinQuery;
        if (!includeOrphaned) {
          whereQuery = whereQuery.where(isNull(l2Block.orphan_timestamp));
        }
        whereQuery = whereQuery.orderBy(desc(l2Block.height)).limit(1);
      } else {
        // Get specific height
        whereQuery = joinQuery
          .where(
            includeOrphaned
              ? eq(l2Block.height, args.height)
              : and(
                  eq(l2Block.height, args.height),
                  isNull(l2Block.orphan_timestamp),
                ),
          )
          .limit(1);
      }
      break;
    case GetTypes.BlockHash:
      // When getting by hash, we don't filter orphaned blocks because
      // we might want to retrieve a specific orphaned block
      whereQuery = joinQuery.where(eq(l2Block.hash, args.hash)).limit(1);
      break;
    case GetTypes.Range:
      whereQuery = joinQuery
        .where(
          includeOrphaned
            ? whereRange
            : and(whereRange, isNull(l2Block.orphan_timestamp)),
        )
        .orderBy(desc(l2Block.height))
        .limit(DB_MAX_BLOCKS);
      break;
  }
  const results = await whereQuery.execute();
  const blocks: ChicmozL2BlockLight[] = [];
  for (const result of results) {
    // Use the data from the joined subqueries
    const txEffectsHashes = result.txEffects
      ? (result.txEffects as HexString[]).map((hash) => ({ txHash: hash }))
      : [];

    // Use the finalization status from the subquery
    let finalizationStatusValue = result.finalizationStatus;
    if (finalizationStatusValue === undefined) {
      finalizationStatusValue = FIRST_FINALIZATION_STATUS;
      logger.warn(`Finalization status not found for block ${result.hash}`);
    }

    const blockData = {
      hash: result.hash,
      height: result.height,
      finalizationStatus: finalizationStatusValue,
      archive: result.archive,
      proposedOnL1: result.l1L2BlockProposed?.l1BlockTimestamp
        ? result.l1L2BlockProposed
        : undefined,
      proofVerifiedOnL1: result.l1L2ProofVerified?.l1BlockTimestamp
        ? result.l1L2ProofVerified
        : undefined,
      // Include orphan information if it exists
      orphan: result.orphan_timestamp
        ? {
            timestamp: result.orphan_timestamp,
            hasOrphanedParent: result.orphan_hasOrphanedParent ?? false,
          }
        : undefined,
      header: {
        lastArchive: result.header_LastArchive,
        totalFees: result.header_TotalFees,
        totalManaUsed: result.header_TotalManaUsed,
        contentCommitment: result.header_ContentCommitment,
        state: {
          l1ToL2MessageTree: result.header_State_L1ToL2MessageTree,
          partial: {
            noteHashTree: result.header_State_Partial_NoteHashTree,
            nullifierTree: result.header_State_Partial_NullifierTree,
            publicDataTree: result.headerState_Partial_PublicDataTree,
          },
        },
        globalVariables: {
          ...result.header_GlobalVariables,
          gasFees: result.header_GlobalVariables_GasFees,
        },
      },
      body: {
        txEffects: txEffectsHashes,
      },
    };

    blocks.push(await chicmozL2BlockLightSchema.parseAsync(blockData));
  }
  return blocks;
};

/**
 * Get all orphaned blocks
 * @param limit Maximum number of orphaned blocks to return
 * @returns Array of orphaned blocks
 */
export const getOrphanedBlocks = async (
  limit: number = DB_MAX_BLOCKS,
): Promise<ChicmozL2BlockLight[]> => {
  // Find all orphaned blocks
  const orphanedBlockHashes = await db()
    .select({ hash: l2Block.hash })
    .from(l2Block)
    .where(isNotNull(l2Block.orphan_timestamp))
    .orderBy(desc(l2Block.orphan_timestamp), desc(l2Block.height))
    .limit(limit)
    .execute();

  const blocks: ChicmozL2BlockLight[] = [];

  // Get full block data for each orphaned block
  for (const { hash } of orphanedBlockHashes) {
    const block = await getBlock(hash, { includeOrphaned: true });
    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
};

/**
 * Get information about reorgs
 * @returns Array of reorg events with details about orphaned blocks
 */
export const getReorgs = async (): Promise<
  {
    orphanedBlockHash: HexString;
    height: bigint;
    timestamp: Date;
    nbrOfOrphanedBlocks: number;
  }[]
> => {
  // Get all root orphaned blocks (those with hasOrphanedParent = false)
  const rootOrphanedBlocks = await db()
    .select({
      hash: l2Block.hash,
      height: l2Block.height,
      timestamp: l2Block.orphan_timestamp,
    })
    .from(l2Block)
    .where(
      and(
        isNotNull(l2Block.orphan_timestamp),
        eq(l2Block.orphan_hasOrphanedParent, false),
      ),
    )
    .orderBy(desc(l2Block.orphan_timestamp))
    .execute();

  const result = [];

  // For each root orphaned block, count how many children it has
  for (const rootBlock of rootOrphanedBlocks) {
    if (!rootBlock.timestamp) {
      continue;
    }

    // Count orphaned blocks with the same timestamp (these are all part of the same re-org)
    const childCount = await db()
      .select({ count: count() })
      .from(l2Block)
      .where(
        and(
          eq(l2Block.orphan_timestamp, rootBlock.timestamp),
          eq(l2Block.orphan_hasOrphanedParent, true),
        ),
      )
      .execute();

    result.push({
      orphanedBlockHash: rootBlock.hash,
      height: rootBlock.height,
      timestamp: new Date(rootBlock.timestamp),
      nbrOfOrphanedBlocks: (childCount[0]?.count || 0) + 1, // +1 for the root block itself
    });
  }

  return result;
};
