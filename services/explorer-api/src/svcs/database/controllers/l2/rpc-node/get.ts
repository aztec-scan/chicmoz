import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2RpcNode, chicmozL2RpcNodeSchema } from "@chicmoz-pkg/types";
import assert from "assert";
import { and, eq, isNotNull } from "drizzle-orm";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";

type ChicmozDbL2RpcNode = ChicmozL2RpcNode;

export async function getRawL2RpcNodeByName(
  rpcNodeName: ChicmozL2RpcNode["rpcNodeName"],
): Promise<ChicmozDbL2RpcNode> {
  const res = await db()
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
    .limit(1);
  assert(res?.[0].rpcNodeName, "rpc node not found");
  return chicmozL2RpcNodeSchema.parse(res[0]);
}

export async function getAllL2RpcNodes(): Promise<ChicmozL2RpcNode[]> {
  const res = await db()
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
  return res.map((rpcNode) => chicmozL2RpcNodeSchema.parse(rpcNode));
}

export const getL2RpcNode = getRawL2RpcNodeByName;
