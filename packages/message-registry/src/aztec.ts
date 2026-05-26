import type {
  ChicmozChainInfo,
  ChicmozL2Tips,
  ChicmozL2ContractInstanceDeployedEvent,
  ChicmozL2DroppedTx,
  ChicmozL2PendingTx,
  ChicmozL2RpcNode,
  ChicmozL2RpcNodeError,
  L2NetworkId,
  SourceVerificationFailureStage,
} from "@chicmoz-pkg/types";

export type L2BlockStatusHint = "proposed" | "proven";

export type NewBlockEvent = {
  blockNumber: number;
  statusHint: L2BlockStatusHint;
  block?: string;
};

export type PendingTxsEvent = {
  txs: ChicmozL2PendingTx[];
};

export type DroppedTxsEvent = {
  txs: ChicmozL2DroppedTx[];
};

export type ContractInstanceBalanceEvent = {
  contractAddress: ChicmozL2ContractInstanceDeployedEvent["address"];
  balance: string;
  timestamp: number;
  // Hash of the L2 tx whose execution caused the balance change. Optional
  // for backwards compatibility with subscribers that haven't been updated.
  sourceTxHash?: string;
};

export type CatchupBlockEvent = NewBlockEvent & {
  requestId?: string;
  catchupReason?: "startup" | "cadence" | "manual" | "eternal" | "reorg_repair";
};

export type L2TipsEvent = {
  tips: ChicmozL2Tips;
  observedAt: number;
  source: {
    rpcNodeName?: string;
    aztecNodeVersion?: string;
  };
};

export type L2BlockRangeRequestReason =
  | "startup"
  | "cadence"
  | "manual"
  | "reorg_repair"
  | "tip_boundary_mismatch";

export type L2BlockRangeRequestEvent = {
  requestId: string;
  requestedAt: number;
  reason: L2BlockRangeRequestReason;
  ranges: Array<{
    from: number;
    to: number;
    statusHint?: "proposed" | "proven";
  }>;
  maxBlocks?: number;
};

export type ChicmozL2RpcNodeAliveEvent = {
  rpcUrl: ChicmozL2RpcNode["rpcUrl"];
  rpcNodeName: ChicmozL2RpcNode["rpcNodeName"];
  timestamp: number;
};

export type ChicmozL2RpcNodeErrorEvent = {
  nodeError: ChicmozL2RpcNodeError;
};

export type ChicmozL2RpcNodeInfoEvent = {
  rpcNode: ChicmozL2RpcNode;
};

export type ChicmozChainInfoEvent = {
  chainInfo: ChicmozChainInfo;
};

export type CompileSourceRequestEvent = {
  jobId: string;
  contractClassId: string;
  version: number;
  githubUrl: string;
  gitRef?: string;
  subPath?: string;
};

export type CompileSourceResultEvent = {
  jobId: string;
  contractClassId: string;
  version: number;
  status: "success" | "compilation_failed" | "clone_failed" | "timeout";
  aztecVersion?: string;
  artifactJson?: string;
  sourceFiles?: Array<{ path: string; content: string }>;
  commitHash?: string;
  error?: string;
  failureStage?: SourceVerificationFailureStage;
  compileOutput?: string;
};

export function generateL2TopicName(
  networkId: L2NetworkId,
  topic: keyof L2_MESSAGES,
): L2Topic {
  return `${networkId}__${topic}`;
}

export type L2_MESSAGES = {
  NEW_BLOCK_EVENT: NewBlockEvent;
  CATCHUP_BLOCK_EVENT: CatchupBlockEvent;
  L2_TIPS_EVENT: L2TipsEvent;
  L2_BLOCK_RANGE_REQUEST_EVENT: L2BlockRangeRequestEvent;
  PENDING_TXS_EVENT: PendingTxsEvent;
  DROPPED_TXS_EVENT: DroppedTxsEvent;
  CONTRACT_INSTANCE_BALANCE_EVENT: ContractInstanceBalanceEvent;
  L2_RPC_NODE_ERROR_EVENT: ChicmozL2RpcNodeErrorEvent;
  L2_RPC_NODE_ALIVE_EVENT: ChicmozL2RpcNodeAliveEvent;
  L2_RPC_NODE_INFO_EVENT: ChicmozL2RpcNodeInfoEvent;
  CHAIN_INFO_EVENT: ChicmozChainInfoEvent;
  COMPILE_SOURCE_REQUEST_EVENT: CompileSourceRequestEvent;
  COMPILE_SOURCE_RESULT_EVENT: CompileSourceResultEvent;
};

export type L2Topic = `${L2NetworkId}__${keyof L2_MESSAGES}`;
export type L2Payload = L2_MESSAGES[keyof L2_MESSAGES];
