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
  desc,
  eq,
  getTableColumns,
  gte,
  isNotNull,
  lt,
  sql,
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

// Helper function to create a publicDataWrites subquery
const createPublicDataWritesSubquery = () => {
  return db()
    .select({
      txEffectHash: publicDataWrite.txEffectHash,
      publicDataWrites: sql`COALESCE(json_agg(
        json_build_object(
          'id', ${publicDataWrite.id},
          'txEffectHash', ${publicDataWrite.txEffectHash},
          'index', ${publicDataWrite.index},
          'leafSlot', ${publicDataWrite.leafSlot},
          'value', ${publicDataWrite.value}
        ) ORDER BY ${publicDataWrite.index} ASC
      ), '[]'::json)`.as("public_data_writes"),
    })
    .from(publicDataWrite)
    .groupBy(publicDataWrite.txEffectHash)
    .as("pdw_agg");
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
  // Create the publicDataWrites subquery
  const publicDataWritesSubquery = createPublicDataWritesSubquery();

  const joinQuery = db()
    .select({
      ...getTableColumns(txEffect),
      blockHeight: l2Block.height,
      blockHash: l2Block.hash,
      timestamp: globalVariables.timestamp,
      isOrphaned: isNotNull(l2Block.orphan_timestamp),
      publicDataWrites: publicDataWritesSubquery.publicDataWrites,
    })
    .from(l2Block)
    .innerJoin(body, eq(l2Block.hash, body.blockHash))
    .innerJoin(txEffect, eq(body.id, txEffect.bodyId))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .leftJoin(
      publicDataWritesSubquery,
      eq(txEffect.txHash, publicDataWritesSubquery.txEffectHash),
    );

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
          .orderBy(desc(l2Block.height), desc(txEffect.index))
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

  // Process the results directly without additional queries
  const txEffects: ChicmozL2TxEffectDeluxe[] = dbRes.map((txEffect) => {
    // Ensure publicDataWrites is properly cast to the expected type
    const publicDataWrites = Array.isArray(txEffect.publicDataWrites)
      ? txEffect.publicDataWrites
      : [];

    return {
      ...txEffect,
      txBirthTimestamp: txEffect.txBirthTimestamp,
      publicDataWrites,
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
  });

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
  // Create the publicDataWrites subquery
  const publicDataWritesSubquery = createPublicDataWritesSubquery();

  const dbRes = await db()
    .select({
      ...getTableColumns(txEffect),
      blockHeight: l2Block.height,
      blockHash: l2Block.hash,
      timestamp: globalVariables.timestamp,
      isOrphaned: isNotNull(l2Block.orphan_timestamp),
      publicDataWrites: publicDataWritesSubquery.publicDataWrites,
    })
    .from(txEffect)
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
    .leftJoin(
      publicDataWritesSubquery,
      eq(txEffect.txHash, publicDataWritesSubquery.txEffectHash),
    )
    .where(whereMatcher)
    .limit(1)
    .execute();

  if (dbRes.length === 0) {
    return null;
  }

  // Ensure publicDataWrites is properly cast to the expected type
  const publicDataWrites = Array.isArray(dbRes[0].publicDataWrites)
    ? dbRes[0].publicDataWrites
    : [];

  const toParse: ChicmozL2TxEffectDeluxe = {
    ...dbRes[0],
    txBirthTimestamp: dbRes[0].txBirthTimestamp,
    publicDataWrites,
    revertCode: { code: dbRes[0].revertCode },
    noteHashes: (Array.isArray(dbRes[0].noteHashes)
      ? dbRes[0].noteHashes
      : []) as string[],
    nullifiers: (Array.isArray(dbRes[0].nullifiers)
      ? dbRes[0].nullifiers
      : []) as string[],
    l2ToL1Msgs: Array.isArray(dbRes[0].l2ToL1Msgs)
      ? dbRes[0].l2ToL1Msgs
      : ([] as string[]),
    privateLogs: (Array.isArray(dbRes[0].privateLogs)
      ? dbRes[0].privateLogs
      : []) as ChicmozL2TxEffect["privateLogs"],
    publicLogs: (Array.isArray(dbRes[0].publicLogs)
      ? dbRes[0].publicLogs
      : []) as ChicmozL2TxEffect["publicLogs"],
    contractClassLogs: (Array.isArray(dbRes[0].contractClassLogs)
      ? dbRes[0].contractClassLogs
      : []) as ChicmozL2TxEffect["contractClassLogs"],
    isOrphaned: Boolean(dbRes[0].isOrphaned),
  };

  return chicmozL2TxEffectDeluxeSchema.parse(toParse);
};

export const txEffectExists = async (hash: HexString): Promise<boolean> => {
  const res = await db()
    .select({
      txHash: txEffect.txHash,
    })
    .from(txEffect)
    .where(eq(txEffect.txHash, hash))
    .limit(1)
    .execute();

  return res.length > 0;
};
