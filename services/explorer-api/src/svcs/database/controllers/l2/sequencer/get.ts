import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2Sequencer,
  ChicmozL2SequencerDeluxe,
  chicmozL2SequencerDeluxeSchema,
  chicmozL2SequencerSchema,
} from "@chicmoz-pkg/types";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { l2RpcNodeErrorTable } from "../../../schema/l2/rpc-node-error.js";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";
import { l2SequencerTable } from "../../../schema/l2/sequencer.js";

export async function getAllSequencers(): Promise<ChicmozL2Sequencer[]> {
  const dbResult = await db()
    .select({
      ...getTableColumns(l2SequencerTable),
      lastSeenAt: l2RpcNodeTable.lastSeenAt,
    })
    .from(l2SequencerTable)
    .leftJoin(l2RpcNodeTable, eq(l2SequencerTable.rpcNodeId, l2RpcNodeTable.id))
    .execute();
  return z.array(chicmozL2SequencerSchema).parse(dbResult);
}

export async function getSequencerByEnr(
  enr: ChicmozL2Sequencer["enr"]
): Promise<ChicmozL2SequencerDeluxe | null> {
  return db().transaction(async (tx) => {
    const sequencerRes = await tx
      .select({
        ...getTableColumns(l2SequencerTable),
        lastSeenAt: l2RpcNodeTable.lastSeenAt,
      })
      .from(l2SequencerTable)
      .where(eq(l2SequencerTable.enr, enr))
      .leftJoin(
        l2RpcNodeTable,
        eq(l2SequencerTable.rpcNodeId, l2RpcNodeTable.id)
      )
      .limit(1)
      .execute();
    if (sequencerRes.length === 0) {return null;}
    const errors = await tx
      .select()
      .from(l2RpcNodeErrorTable)
      .where(eq(l2RpcNodeErrorTable.rpcNodeId, sequencerRes[0].rpcNodeId))
      .execute();
    return chicmozL2SequencerDeluxeSchema.parse({
      ...sequencerRes[0],
      errors,
    });
  });
}
