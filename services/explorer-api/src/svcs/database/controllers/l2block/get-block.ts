import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2BlockLight,
  FIRST_FINALIZATION_STATUS,
  HexString,
  chicmozL2BlockLightSchema,
} from "@chicmoz-pkg/types";
import { and, asc, desc, eq, getTableColumns } from "drizzle-orm";
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

export const getBlocks = async ({
  from,
  to,
}: {
  from: bigint | undefined;
  to: bigint | undefined;
}): Promise<ChicmozL2BlockLight[]> => {
  return _getBlocks({ from, to, getType: GetTypes.Range });
};

export const getBlock = async (
  heightOrHash: bigint | HexString,
): Promise<ChicmozL2BlockLight | null> => {
  const res = await _getBlocks(
    typeof heightOrHash === "bigint"
      ? { height: heightOrHash, getType: GetTypes.BlockHeight }
      : { hash: heightOrHash, getType: GetTypes.BlockHash },
  );
  if (res.length === 0) {
    return null;
  }
  return res[0];
};

type GetBlocksArgs = GetBlocksByHeight | GetBlocksByHash | GetBlocksByRange;

const _getBlocks = async (
  args: GetBlocksArgs,
): Promise<ChicmozL2BlockLight[]> => {
  const whereRange =
    args.getType === GetTypes.Range ? getBlocksWhereRange(args) : undefined;

  if (args.getType === GetTypes.BlockHeight) {
    if (args.height < -1) {
      throw new Error("Invalid height");
    }
  }

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
    );

  let whereQuery;

  switch (args.getType) {
    case GetTypes.BlockHeight:
      whereQuery =
        args.height === -1n
          ? joinQuery.orderBy(desc(l2Block.height)).limit(1)
          : joinQuery.where(eq(l2Block.height, args.height)).limit(1);
      break;
    case GetTypes.BlockHash:
      whereQuery = joinQuery.where(eq(l2Block.hash, args.hash)).limit(1);
      break;
    case GetTypes.Range:
      whereQuery = joinQuery
        .where(whereRange)
        .orderBy(desc(l2Block.height))
        .limit(DB_MAX_BLOCKS);
      break;
  }

  const results = await whereQuery.execute();

  const blocks: ChicmozL2BlockLight[] = [];

  for (const result of results) {
    const txEffectsHashes = await db()
      .select({
        txHash: txEffect.txHash,
      })
      .from(txEffect)
      .where(eq(txEffect.bodyId, result.bodyId))
      .orderBy(asc(txEffect.index));
    const finalizationStatus = await db()
      .select(getTableColumns(l2BlockFinalizationStatusTable))
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
