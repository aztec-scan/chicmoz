import {
  ChicmozChainInfo,
  ChicmozL2BlockFinalizationStatus,
  ChicmozL2PendingTx,
  ChicmozL2RpcNode,
  ChicmozL2RpcNodeError,
  ChicmozL2Sequencer,
  L2NetworkId,
} from "@chicmoz-pkg/types";

export type NewBlockEvent = {
  blockNumber: number;
  finalizationStatus: ChicmozL2BlockFinalizationStatus;
  block?: string;
};

export type PendingTxsEvent = {
  txs: ChicmozL2PendingTx[];
};

export type CatchupBlockEvent = NewBlockEvent;

export type ChicmozL2RpcNodeAliveEvent = {
  rpcUrl: ChicmozL2RpcNode["rpcUrl"];
  timestamp: number;
};

export type ChicmozL2RpcNodeErrorEvent = {
  nodeError: ChicmozL2RpcNodeError;
};

export type ChicmozSequencerEvent = {
  sequencer: ChicmozL2Sequencer;
};

export type ChicmozChainInfoEvent = {
  chainInfo: ChicmozChainInfo;
};

export function generateL2TopicName(
  networkId: L2NetworkId,
  topic: keyof L2_MESSAGES
): L2Topic {
  return `${networkId}__${topic}`;
}

export type L2_MESSAGES = {
  NEW_BLOCK_EVENT: NewBlockEvent;
  CATCHUP_BLOCK_EVENT: CatchupBlockEvent;
  PENDING_TXS_EVENT: PendingTxsEvent;
  L2_RPC_NODE_ERROR_EVENT: ChicmozL2RpcNodeErrorEvent;
  L2_RPC_NODE_ALIVE_EVENT: ChicmozL2RpcNodeAliveEvent;
  SEQUENCER_INFO_EVENT: ChicmozSequencerEvent;
  CHAIN_INFO_EVENT: ChicmozChainInfoEvent;
};

export type L2Topic = `${L2NetworkId}__${keyof L2_MESSAGES}`;
export type L2Payload = L2_MESSAGES[keyof L2_MESSAGES];
