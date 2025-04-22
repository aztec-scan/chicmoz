import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2TxEffect,
  ChicmozL2TxEffectDeluxe,
  HexString,
  chicmozL2TxEffectDeluxeSchema,
} from "@chicmoz-pkg/types";
import assert from "assert";
import {
  SQL,
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  isNotNull,
  lt,
} from "drizzle-orm";
import { z } from "zod";
import { DB_MAX_TX_EFFECTS } from "../../../../environment.js";
import {
  body,
  globalVariables,
  header,
  l2Block,
  publicDataWrite,
  txEffect,
} from "../../../database/schema/l2block/index.js";

enum GetTypes {
  BlockHeightRange,
  BlockHeightAndIndex,
}

type GetTxEffectByBlockHeightAndIndex = {
  blockHeight: bigint;
  txEffectIndex: number;
  getType: GetTypes.BlockHeightAndIndex;
};

type GetTxEffectsByBlockHeightRange = {
  from?: bigint;
  to?: bigint;
  getType: GetTypes.BlockHeightRange;
};

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

export const getTxEffectByBlockHeightAndIndex = async (
  blockHeight: bigint,
  txEffectIndex: number,
): Promise<ChicmozL2TxEffectDeluxe | null> => {
  const res = await _getTxEffects({
    blockHeight,
    txEffectIndex,
    getType: GetTypes.BlockHeightAndIndex,
  });

  if (res.length === 0) {
    return null;
  }

  return res[0];
};

export const getTxEffectsByBlockHeight = async (
  height: bigint,
): Promise<ChicmozL2TxEffectDeluxe[]> => {
  return _getTxEffects({
    from: height,
    to: height + 1n,
    getType: GetTypes.BlockHeightRange,
  });
};

export const getLatestTxEffects = async (): Promise<
  ChicmozL2TxEffectDeluxe[]
> => {
  return _getTxEffects({
    getType: GetTypes.BlockHeightRange,
  });
};

const generateWhereQuery = (from?: bigint, to?: bigint) => {
  if (from && !to) {
    return gte(l2Block.height, from);
  } else if (!from && to) {
    return lt(l2Block.height, to);
  }
  assert(
    from && to,
    "FATAL: cannot have both from and to undefined when generating where query",
  );
  return and(gte(l2Block.height, from), lt(l2Block.height, to));
};

const _getTxEffects = async (
  args: GetTxEffectByBlockHeightAndIndex | GetTxEffectsByBlockHeightRange,
): Promise<ChicmozL2TxEffectDeluxe[]> => {
  const joinQuery = db()
    .select({
      ...getTableColumns(txEffect),
      blockHeight: l2Block.height,
      blockHash: l2Block.hash,
      timestamp: globalVariables.timestamp,
      isOrphaned: isNotNull(l2Block.orphan_timestamp), // Using the imported isNotNull function
    })
    .from(l2Block)
    .innerJoin(body, eq(l2Block.hash, body.blockHash))
    .innerJoin(txEffect, eq(body.id, txEffect.bodyId))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId));

  let whereQuery;

  switch (args.getType) {
    case GetTypes.BlockHeightRange:
      if (args.from ?? args.to) {
        whereQuery = joinQuery
          .where(generateWhereQuery(args.from, args.to))
          .orderBy(desc(l2Block.height), desc(txEffect.index))
          .limit(DB_MAX_TX_EFFECTS);
      } else {
        whereQuery = joinQuery
          .orderBy(desc(txEffect.index), desc(l2Block.height))
          .limit(DB_MAX_TX_EFFECTS);
      }
      break;
    case GetTypes.BlockHeightAndIndex:
      whereQuery = joinQuery
        .where(
          and(
            eq(l2Block.height, args.blockHeight),
            eq(txEffect.index, args.txEffectIndex),
          ),
        )
        .limit(1);
      break;
  }

  const dbRes = await whereQuery.execute();

  const txEffects: ChicmozL2TxEffectDeluxe[] = await Promise.all(
    dbRes.map(async (txEffect) => {
      const nestedData = await getTxEffectNestedByHash(txEffect.txHash);
      return {
        ...txEffect,
        txBirthTimestamp: txEffect.txBirthTimestamp.valueOf(),
        ...nestedData,
        // Ensure revertCode is an object with a code property
        revertCode: { code: txEffect.revertCode },
        // Ensure these are arrays and explicitly typed as string[]
        noteHashes: Array.isArray(txEffect.noteHashes)
          ? txEffect.noteHashes
          : ([] as string[]),
        nullifiers: Array.isArray(txEffect.nullifiers)
          ? txEffect.nullifiers
          : ([] as string[]),
        l2ToL1Msgs: Array.isArray(txEffect.l2ToL1Msgs)
          ? txEffect.l2ToL1Msgs
          : ([] as string[]),
        // Add privateLogs as string[][]
        privateLogs: Array.isArray(txEffect.privateLogs)
          ? txEffect.privateLogs
          : ([] as string[][]),
        // Add other missing properties
        publicLogs: Array.isArray(txEffect.publicLogs)
          ? txEffect.publicLogs
          : ([] as string[][]),
        contractClassLogs: Array.isArray(txEffect.contractClassLogs)
          ? txEffect.contractClassLogs
          : ([] as string[][]),
        // Ensure isOrphaned is boolean
        isOrphaned: Boolean(txEffect.isOrphaned),
      };
    }),
  );

  return z.array(chicmozL2TxEffectDeluxeSchema).parse(txEffects);
};

export const getTxEffectByHash = async (
  hash: HexString,
): Promise<ChicmozL2TxEffectDeluxe | null> => {
  return getTxEffectDynamicWhere(eq(txEffect.txHash, hash));
};

export const getTxEffectDynamicWhere = async (
  whereMatcher: SQL<unknown>,
): Promise<ChicmozL2TxEffectDeluxe | null> => {
  const dbRes = await db()
    .select({
      ...getTableColumns(txEffect),
      blockHeight: l2Block.height,
      blockHash: l2Block.hash,
      timestamp: globalVariables.timestamp,
      isOrphaned: isNotNull(l2Block.orphan_timestamp), // Using the imported isNotNull function
    })
    .from(txEffect)
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .where(whereMatcher)
    .limit(1)
    .execute();

  if (dbRes.length === 0) {
    return null;
  }

  const nestedData = await getTxEffectNestedByHash(dbRes[0].txHash);

  const toParse: ChicmozL2TxEffectDeluxe = {
    ...dbRes[0],
    txBirthTimestamp: dbRes[0].txBirthTimestamp.valueOf(),
    ...nestedData,
    // Ensure revertCode is an object with a code property
    revertCode: { code: dbRes[0].revertCode },
    // Ensure these are arrays and explicitly typed as string[]
    noteHashes: (Array.isArray(dbRes[0].noteHashes)
      ? dbRes[0].noteHashes
      : []) as string[],
    nullifiers: (Array.isArray(dbRes[0].nullifiers)
      ? dbRes[0].nullifiers
      : []) as string[],
    l2ToL1Msgs: Array.isArray(dbRes[0].l2ToL1Msgs)
      ? dbRes[0].l2ToL1Msgs
      : ([] as string[]),
    // Add privateLogs as string[][]
    privateLogs: (Array.isArray(dbRes[0].privateLogs)
      ? dbRes[0].privateLogs
      : []) as string[][],
    // Add other missing properties
    publicLogs: (Array.isArray(dbRes[0].publicLogs)
      ? dbRes[0].publicLogs
      : []) as string[][],
    contractClassLogs: (Array.isArray(dbRes[0].contractClassLogs)
      ? dbRes[0].contractClassLogs
      : []) as ChicmozL2TxEffect["contractClassLogs"],
    // Ensure isOrphaned is boolean
    isOrphaned: Boolean(dbRes[0].isOrphaned),
  };

  return chicmozL2TxEffectDeluxeSchema.parse(toParse);
};
