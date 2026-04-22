import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2RpcNode, chicmozL2RpcNodeSchema } from "@chicmoz-pkg/types";
import assert from "assert";
import { eq } from "drizzle-orm";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";

type ChicmozDbL2RpcNode = ChicmozL2RpcNode;

export async function getRawL2RpcNodeByName(
  rpcNodeName: ChicmozL2RpcNode["rpcNodeName"],
): Promise<ChicmozDbL2RpcNode> {
  const res = await db()
    .select()
    .from(l2RpcNodeTable)
    .where(eq(l2RpcNodeTable.rpcNodeName, rpcNodeName))
    .limit(1);
  assert(res?.[0].rpcNodeName, "rpc node not found");
  return chicmozL2RpcNodeSchema.parse(res[0]);
}

export async function getAllL2RpcNodes(): Promise<ChicmozL2RpcNode[]> {
  const res = await db().select().from(l2RpcNodeTable).execute();
  return res.map((rpcNode) => chicmozL2RpcNodeSchema.parse(rpcNode));
}

export const getL2RpcNode = getRawL2RpcNodeByName;
