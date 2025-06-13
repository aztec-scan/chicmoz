import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2Sequencer } from "@chicmoz-pkg/types";
import assert from "assert";
import { l2RpcNodeTable } from "../../../schema/l2/rpc-node.js";
import { l2SequencerTable } from "../../../schema/l2/sequencer.js";

export async function storeL2Sequencer(
  sequencer: ChicmozL2Sequencer,
): Promise<void> {
  const { enr, rpcUrl, l2NetworkId, rollupVersion, nodeVersion, l1ChainId } =
    sequencer;
  assert(rpcUrl, "rpcUrl is required");
  // Use rpcUrl as name for now - this should be updated when sequencer type includes rpcNodeName
  const name = rpcUrl;
  const lastSeenAt = new Date();

  await db().transaction(async (tx) => {
    const rpcNodeRes = await tx
      .insert(l2RpcNodeTable)
      .values({
        name,
        rpcUrl,
        lastSeenAt,
      })
      .onConflictDoUpdate({
        target: l2RpcNodeTable.rpcUrl,
        set: {
          lastSeenAt,
        },
      })
      .returning({ name: l2RpcNodeTable.name });
    const rpcNode = rpcNodeRes[0];
    await tx
      .insert(l2SequencerTable)
      .values({
        enr,
        rpcNodeName: rpcNode.name,
        l2NetworkId,
        rollupVersion,
        nodeVersion,
        l1ChainId,
      })
      .onConflictDoUpdate({
        target: l2SequencerTable.enr,
        set: {
          rpcNodeName: rpcNode.name,
          l2NetworkId,
          rollupVersion,
          nodeVersion,
          l1ChainId,
        },
      });
  });
}
