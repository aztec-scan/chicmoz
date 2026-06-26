import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type HexString } from "@chicmoz-pkg/types";
import { eq, inArray } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import {
  body,
  l2Block,
  txEffect,
} from "../../../database/schema/l2block/index.js";

export const deleteAllBlocks = async (): Promise<void> => {
  const res = (await db().delete(l2Block).execute()).rowCount;
  logger.info(`🗑️ Deleted ${res} blocks`);
};

export const deleteL2BlockByHeight = async (height: bigint): Promise<void> => {
  await db().delete(l2Block).where(eq(l2Block.height, height)).execute();
};

export const deleteL2BlockByHash = async (hash: HexString): Promise<void> => {
  await db().delete(l2Block).where(eq(l2Block.hash, hash)).execute();
};

export type TxEffectOwner = {
  txHash: HexString;
  blockHash: HexString;
  blockHeight: bigint;
  isOrphaned: boolean;
};

export const getTxEffectOwners = async (
  txHashes: HexString[],
): Promise<TxEffectOwner[]> => {
  if (txHashes.length === 0) {
    return [];
  }

  const uniqueTxHashes = [...new Set(txHashes)];

  const owners = await db()
    .select({
      txHash: txEffect.txHash,
      blockHash: l2Block.hash,
      blockHeight: l2Block.height,
      orphanTimestamp: l2Block.orphan_timestamp,
    })
    .from(txEffect)
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .where(inArray(txEffect.txHash, uniqueTxHashes));

  return owners.map((owner) => ({
    txHash: owner.txHash,
    blockHash: owner.blockHash,
    blockHeight: owner.blockHeight,
    isOrphaned: owner.orphanTimestamp !== null,
  }));
};
