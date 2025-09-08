import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2RpcNodeError,
  chicmozL2RpcNodeErrorSchema,
} from "@chicmoz-pkg/types";
import { l2RpcNodeErrorTable } from "../../../schema/l2/rpc-node-error.js";

export async function getL2RpcNodeErrors(): Promise<ChicmozL2RpcNodeError[]> {
  const result = await db()
    .select({
      name: l2RpcNodeErrorTable.name,
      rpcNodeName: l2RpcNodeErrorTable.rpcNodeName,
      cause: l2RpcNodeErrorTable.cause,
      message: l2RpcNodeErrorTable.message,
      stack: l2RpcNodeErrorTable.stack,
      data: l2RpcNodeErrorTable.data,
      count: l2RpcNodeErrorTable.count,
      createdAt: l2RpcNodeErrorTable.createdAt,
      lastSeenAt: l2RpcNodeErrorTable.lastSeenAt,
    })
    .from(l2RpcNodeErrorTable)
    .execute();

  return result.map((error) => chicmozL2RpcNodeErrorSchema.parse(error));
}
