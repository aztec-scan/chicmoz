import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  body,
  globalVariables,
  header,
  l2Block,
  txEffect,
} from "../../../database/schema/l2block/index.js";

export const getTotalTxEffects = async (): Promise<number> => {
  const dbRes = await db().select({ count: count() }).from(txEffect).execute();
  return dbRes[0].count;
};

const ONE_DAY = 24 * 60 * 60 * 1000;
export const getTotalTxEffectsLast24h = async (): Promise<number> => {
  const dbRes = await db()
    .select({ count: count() })
    .from(txEffect)
    .innerJoin(body, eq(body.id, txEffect.bodyId))
    .innerJoin(l2Block, eq(l2Block.hash, body.blockHash))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(
      globalVariables,
      eq(globalVariables.headerId, header.id)
    )
    .where(
      and(
        gt(globalVariables.timestamp, Date.now() - ONE_DAY),
        lt(globalVariables.timestamp, Date.now())
      )
    )
    .execute();
  return dbRes[0].count;
};
