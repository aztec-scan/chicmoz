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
      rpcNodeName: l2RpcNodeTable.name,
      rpcUrl: l2RpcNodeTable.rpcUrl,
    })
    .from(l2SequencerTable)
    .innerJoin(
      l2RpcNodeTable,
      eq(l2SequencerTable.rpcNodeName, l2RpcNodeTable.name),
    )
    .execute();
  return z.array(chicmozL2SequencerSchema).parse(dbResult);
}

export async function getSequencerByEnr(
  enr: ChicmozL2Sequencer["enr"],
): Promise<ChicmozL2SequencerDeluxe | null> {
  return db().transaction(async (tx) => {
    const sequencerRes = await tx
      .select({
        ...getTableColumns(l2SequencerTable),
        lastSeenAt: l2RpcNodeTable.lastSeenAt,
        rpcNodeName: l2RpcNodeTable.name,
        rpcUrl: l2RpcNodeTable.rpcUrl,
      })
      .from(l2SequencerTable)
      .where(eq(l2SequencerTable.enr, enr))
      .innerJoin(
        l2RpcNodeTable,
        eq(l2SequencerTable.rpcNodeName, l2RpcNodeTable.name),
      )
      .limit(1)
      .execute();
    if (sequencerRes.length === 0) {
      return null;
    }
    const errors = await tx
      .select()
      .from(l2RpcNodeErrorTable)
      .where(eq(l2RpcNodeErrorTable.rpcNodeName, sequencerRes[0].rpcNodeName))
      .execute();
    return chicmozL2SequencerDeluxeSchema.parse({
      ...sequencerRes[0],
      errors,
    });
  });
}
