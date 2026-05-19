import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2RpcNode } from "@chicmoz-pkg/types";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";
import { observeRollupVersion } from "../chain-info/rollup-version-cache.js";

export async function storeL2RpcNode(
  rpcNode: Partial<ChicmozL2RpcNode> &
    Pick<ChicmozL2RpcNode, "rpcNodeName" | "rpcUrl">,
): Promise<void> {
  const lastSeenAt = rpcNode.lastSeenAt ?? new Date();
  const values = {
    rpcNodeName: rpcNode.rpcNodeName,
    rpcUrl: rpcNode.rpcUrl,
    ...(rpcNode.l2NetworkId !== undefined
      ? { l2NetworkId: rpcNode.l2NetworkId }
      : {}),
    ...(rpcNode.rollupVersion !== undefined
      ? { rollupVersion: rpcNode.rollupVersion }
      : {}),
    ...(rpcNode.nodeVersion !== undefined
      ? { nodeVersion: rpcNode.nodeVersion }
      : {}),
    ...(rpcNode.l1ChainId !== undefined
      ? { l1ChainId: rpcNode.l1ChainId }
      : {}),
    ...(rpcNode.createdAt !== undefined
      ? { createdAt: rpcNode.createdAt }
      : {}),
    lastSeenAt,
  };
  const set = {
    rpcUrl: rpcNode.rpcUrl,
    ...(rpcNode.l2NetworkId !== undefined
      ? { l2NetworkId: rpcNode.l2NetworkId }
      : {}),
    ...(rpcNode.rollupVersion !== undefined
      ? { rollupVersion: rpcNode.rollupVersion }
      : {}),
    ...(rpcNode.nodeVersion !== undefined
      ? { nodeVersion: rpcNode.nodeVersion }
      : {}),
    ...(rpcNode.l1ChainId !== undefined
      ? { l1ChainId: rpcNode.l1ChainId }
      : {}),
    lastSeenAt,
  };

  await db().insert(l2RpcNodeTable).values(values).onConflictDoUpdate({
    target: l2RpcNodeTable.rpcNodeName,
    set,
  });

  if (rpcNode.l2NetworkId !== undefined && rpcNode.rollupVersion !== undefined) {
    await observeRollupVersion({
      l2NetworkId: rpcNode.l2NetworkId,
      rollupVersion: rpcNode.rollupVersion,
      source: "node-info",
    });
  }
}
