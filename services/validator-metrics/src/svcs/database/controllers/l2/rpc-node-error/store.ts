import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2RpcNodeError } from "@chicmoz-pkg/types";
import assert from "assert";
import { sql } from "drizzle-orm";
import { l2RpcNodeErrorTable } from "../../../schema/l2/rpc-node-error.js";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";

export async function storeL2RpcNodeError(
  rpcNodeError: ChicmozL2RpcNodeError,
): Promise<void> {
  const { name, rpcUrl, nodeName, cause, message, stack, data } = rpcNodeError;
  assert(
    rpcUrl,
    `rpcUrl is required to store rpc node error ${JSON.stringify(rpcNodeError)}`,
  );
  assert(
    nodeName,
    `nodeName is required to store rpc node error ${JSON.stringify(rpcNodeError)}`,
  );

  await db().transaction(async (tx) => {
    const rpcNodeRes = await tx
      .insert(l2RpcNodeTable)
      .values({
        name: nodeName,
        rpcUrl,
      })
      .onConflictDoUpdate({
        // NOTE: this is only here to return the name
        target: l2RpcNodeTable.rpcUrl,
        set: {
          rpcUrl,
        },
      })
      .returning({ name: l2RpcNodeTable.name });
    const rpcNode = rpcNodeRes[0];
    await tx
      .insert(l2RpcNodeErrorTable)
      .values({
        name,
        rpcNodeName: rpcNode.name,
        cause,
        message,
        stack,
        data,
      })
      .onConflictDoUpdate({
        target: l2RpcNodeErrorTable.name,
        set: {
          cause,
          message,
          stack,
          data,
          count: sql`${l2RpcNodeErrorTable.count} + 1`,
          lastSeenAt: new Date(),
        },
      });
  });
}
