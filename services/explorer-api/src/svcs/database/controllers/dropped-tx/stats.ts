import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, count, gt, lt } from "drizzle-orm";
import { droppedTx } from "../../../database/schema/dropped-tx/index.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

export const getTotalDroppedTxsLast24h = async (): Promise<number> => {
  const dbRes = await db()
    .select({ count: count() })
    .from(droppedTx)
    .where(
      and(
        gt(droppedTx.droppedAt, Date.now() - ONE_DAY),
        lt(droppedTx.droppedAt, Date.now()),
      ),
    )
    .execute();
  return dbRes[0].count;
};
