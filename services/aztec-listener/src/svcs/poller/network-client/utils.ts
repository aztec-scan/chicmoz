import { NodeInfo } from "@aztec/aztec.js/node";
import {
  ChicmozChainInfo,
  ChicmozL2Sequencer,
  L2NetworkId,
  chicmozChainInfoSchema,
  chicmozL2SequencerSchema,
} from "@chicmoz-pkg/types";

export const getChicmozChainInfoFromNodeInfo = (
  l2NetworkId: L2NetworkId,
  nodeInfo: NodeInfo,
): ChicmozChainInfo => {
  return chicmozChainInfoSchema.parse({
    l2NetworkId,
    ...JSON.parse(JSON.stringify(nodeInfo)),
  });
};

export const getSequencerFromNodeInfo = (
  l2NetworkId: L2NetworkId,
  rpcUrl: string,
  nodeInfo: NodeInfo,
): ChicmozL2Sequencer => {
  return chicmozL2SequencerSchema.parse({
    l2NetworkId,
    rpcUrl,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    ...JSON.parse(JSON.stringify(nodeInfo)),
  });
};
