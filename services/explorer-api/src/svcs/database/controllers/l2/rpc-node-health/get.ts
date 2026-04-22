import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2RpcNode,
  ChicmozL2RpcNodeDeluxe,
  chicmozL2RpcNodeDeluxeSchema,
  chicmozL2RpcNodeSchema,
} from "@chicmoz-pkg/types";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { l2RpcNodeErrorTable } from "../../../schema/l2/rpc-node-error.js";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";

export async function getAllRpcNodes(): Promise<ChicmozL2RpcNode[]> {
  const dbResult = await db()
    .select()
    .from(l2RpcNodeTable)
    .where(
      and(
        isNotNull(l2RpcNodeTable.l2NetworkId),
        isNotNull(l2RpcNodeTable.rollupVersion),
        isNotNull(l2RpcNodeTable.nodeVersion),
        isNotNull(l2RpcNodeTable.l1ChainId),
      ),
    )
    .execute();
  return z.array(chicmozL2RpcNodeSchema).parse(dbResult);
}

export async function getL2RpcNodeByName(
  rpcNodeName: ChicmozL2RpcNode["rpcNodeName"],
): Promise<ChicmozL2RpcNodeDeluxe | null> {
  return db().transaction(async (tx) => {
    const rpcNodeRes = await tx
      .select()
      .from(l2RpcNodeTable)
      .where(
        and(
          eq(l2RpcNodeTable.rpcNodeName, rpcNodeName),
          isNotNull(l2RpcNodeTable.l2NetworkId),
          isNotNull(l2RpcNodeTable.rollupVersion),
          isNotNull(l2RpcNodeTable.nodeVersion),
          isNotNull(l2RpcNodeTable.l1ChainId),
        ),
      )
      .limit(1)
      .execute();
    if (rpcNodeRes.length === 0) {
      return null;
    }
    const errors = await tx
      .select()
      .from(l2RpcNodeErrorTable)
      .where(eq(l2RpcNodeErrorTable.rpcNodeName, rpcNodeRes[0].rpcNodeName))
      .execute();
    return chicmozL2RpcNodeDeluxeSchema.parse({
      ...rpcNodeRes[0],
      errors,
    });
  });
}
