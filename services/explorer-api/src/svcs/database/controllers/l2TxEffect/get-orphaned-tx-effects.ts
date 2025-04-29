import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2TxEffect,
  ChicmozL2TxEffectDeluxe,
  chicmozL2TxEffectDeluxeSchema,
} from "@chicmoz-pkg/types";
import { and, asc, eq, getTableColumns, gte, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { logger } from "../../../../logger.js";
import {
  body,
  globalVariables,
  header,
  l2Block,
  publicDataWrite,
  txEffect,
} from "../../../database/schema/l2block/index.js";

/**
 * Retrieves all transaction effects that were part of orphaned blocks
 * @param startingBlockHash The hash of the first block that was orphaned
 * @param startingBlockHeight The height of the first block that was orphaned
 * @returns An array of transaction effects that were in orphaned blocks
 */
export const getTxEffectsFromOrphanedBlocks = async (
  startingBlockHash: string,
  startingBlockHeight: bigint,
): Promise<ChicmozL2TxEffectDeluxe[]> => {
  try {
    logger.debug(
      `Retrieving l2TxEffects from orphaned blocks starting at height ${startingBlockHeight} with hash ${startingBlockHash}`,
    );

    // Find all orphaned blocks at or above the specified height using Drizzle ORM
    const dbRes = await db()
      .select({
        ...getTableColumns(txEffect),
        blockHeight: l2Block.height,
        blockHash: l2Block.hash,
        timestamp: globalVariables.timestamp,
        isOrphaned: isNotNull(l2Block.orphan_timestamp),
      })
      .from(l2Block)
      .innerJoin(body, eq(l2Block.hash, body.blockHash))
      .innerJoin(txEffect, eq(body.id, txEffect.bodyId))
      .innerJoin(header, eq(l2Block.hash, header.blockHash))
      .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
      .where(
        and(
          gte(l2Block.height, startingBlockHeight),
          isNotNull(l2Block.orphan_timestamp),
        ),
      )
      .execute();

    // Process results similarly to other functions in get-tx-effect.ts
    const txEffects: ChicmozL2TxEffectDeluxe[] = await Promise.all(
      dbRes.map(async (txEffect) => {
        const nestedData = await getTxEffectNestedByHash(txEffect.txHash);
        return {
          ...txEffect,
          txBirthTimestamp: txEffect.txBirthTimestamp.valueOf(),
          ...nestedData,
          revertCode: { code: txEffect.revertCode },
          noteHashes: Array.isArray(txEffect.noteHashes)
            ? txEffect.noteHashes
            : ([] as string[]),
          nullifiers: Array.isArray(txEffect.nullifiers)
            ? txEffect.nullifiers
            : ([] as string[]),
          l2ToL1Msgs: Array.isArray(txEffect.l2ToL1Msgs)
            ? txEffect.l2ToL1Msgs
            : ([] as string[]),
          privateLogs: Array.isArray(txEffect.privateLogs)
            ? txEffect.privateLogs
            : ([] as string[][]),
          publicLogs: Array.isArray(txEffect.publicLogs)
            ? txEffect.publicLogs
            : ([] as string[][]),
          contractClassLogs: Array.isArray(txEffect.contractClassLogs)
            ? txEffect.contractClassLogs
            : ([] as string[][]),
          isOrphaned: Boolean(txEffect.isOrphaned),
        };
      }),
    );

    logger.debug(
      `Retrieved ${txEffects.length} l2TxEffects from orphaned blocks`,
    );

    return z.array(chicmozL2TxEffectDeluxeSchema).parse(txEffects);
  } catch (error) {
    logger.error(
      `Error retrieving l2TxEffects from orphaned blocks: ${
        (error as Error).message
      }`,
      { error },
    );
    throw error;
  }
};

// Helper function to get nested data for a txEffect, similar to the one in get-tx-effect.ts
const getTxEffectNestedByHash = async (
  txEffectHash: string,
): Promise<Pick<ChicmozL2TxEffect, "publicDataWrites">> => {
  const publicDataWrites = await db()
    .select({
      ...getTableColumns(publicDataWrite),
    })
    .from(publicDataWrite)
    .innerJoin(txEffect, eq(txEffect.txHash, publicDataWrite.txEffectHash))
    .where(eq(publicDataWrite.txEffectHash, txEffectHash))
    .orderBy(asc(publicDataWrite.index))
    .execute();
  return {
    publicDataWrites,
  };
};
