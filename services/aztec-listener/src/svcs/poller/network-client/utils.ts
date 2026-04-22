import { NodeInfo } from "@aztec/aztec.js/node";
import {
  ChicmozChainInfo,
  ChicmozL2RpcNode,
  L2NetworkId,
  chicmozChainInfoSchema,
  chicmozL2RpcNodeSchema,
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

export const getRpcNodeFromNodeInfo = (
  l2NetworkId: L2NetworkId,
  rpcNodeName: string,
  rpcUrl: string,
  nodeInfo: NodeInfo,
): ChicmozL2RpcNode => {
  return chicmozL2RpcNodeSchema.parse({
    l2NetworkId,
    rpcNodeName,
    rpcUrl,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    ...JSON.parse(JSON.stringify(nodeInfo)),
  });
};
