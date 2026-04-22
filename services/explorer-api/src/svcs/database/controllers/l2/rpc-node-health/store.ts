import { ChicmozL2RpcNode } from "@chicmoz-pkg/types";
import { storeL2RpcNode } from "../rpc-node/store.js";

export async function storeL2Sequencer(
  sequencer: ChicmozL2RpcNode,
): Promise<void> {
  await storeL2RpcNode({
    ...sequencer,
    lastSeenAt: new Date(),
  });
}
