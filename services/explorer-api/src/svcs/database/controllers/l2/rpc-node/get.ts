import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2RpcNode, chicmozL2RpcNodeSchema } from "@chicmoz-pkg/types";
import assert from "assert";
import { eq } from "drizzle-orm";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";

type ChicmozDbL2RpcNode = ChicmozL2RpcNode;

export async function getL2RpcNode(
  rpcUrl: ChicmozL2RpcNode["rpcUrl"]
): Promise<ChicmozDbL2RpcNode> {
  const res = await db()
    .select()
    .from(l2RpcNodeTable)
    .where(eq(l2RpcNodeTable.rpcUrl, rpcUrl))
    .limit(1);
  assert(res[0].name, "rpc node not found");
  return chicmozL2RpcNodeSchema.parse(res[0]) ;
}
