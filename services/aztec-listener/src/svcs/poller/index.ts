import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { NODE_ENV, NodeEnv } from "@chicmoz-pkg/types";
import {
  AZTEC_LISTEN_FOR_CHAIN_INFO,
  AZTEC_LISTEN_FOR_L2_TIPS,
  AZTEC_LISTEN_FOR_PENDING_TXS,
  getConfigStr,
} from "../../environment.js";
import { onL2RpcNodeError } from "../../events/emitted/index.js";
import { ensureInitializedBlockHeights } from "../database/heights.controller.js";
import { init as initNetworkClient } from "./network-client/index.js";
import * as blockPoller from "./pollers/block_poller/index.js";
import * as chainInfoPoller from "./pollers/chain-info-poller.js";
import * as pendingTxsPoller from "./pollers/txs_poller.js";
import * as droppedTxVerifier from "./pollers/dropped-tx-verifier.js";
import * as l2TipsPoller from "./pollers/l2-tips-poller.js";
import { NodeInfo } from "@aztec/aztec.js/contracts";

let nodeInfo: NodeInfo;

export const init = async () => {
  if (NODE_ENV === NodeEnv.DEV) {
    onL2RpcNodeError({
      name: "Mocked Node Error",
      message: "Lorem ipsum dolor sit amet",
      cause: "UnknownCause",
      stack: new Error().stack?.toString() ?? "UnknownStack",
      data: {},
      rpcNodeName: "mocked-rpc-node",
    });
  }
  await ensureInitializedBlockHeights();
  const initResult = await initNetworkClient();
  // Initialize with chainInfo and use type assertions to satisfy TypeScript
  nodeInfo = {
    nodeVersion: "unknown",
    l1ChainId: initResult.chainInfo.l1ChainId,
    rollupVersion: Number(initResult.chainInfo.rollupVersion.toString()),
    l1ContractAddresses: initResult.chainInfo
      .l1ContractAddresses as unknown as NodeInfo["l1ContractAddresses"],
    protocolContractAddresses: initResult.chainInfo
      .protocolContractAddresses as unknown as NodeInfo["protocolContractAddresses"],
    enr: "",
    realProofs: false,
    txsLimits: {
      gas: { daGas: 0, l2Gas: 0 },
    },
  };
};

export const startPoller = () => {
  blockPoller.startPolling();
  if (AZTEC_LISTEN_FOR_PENDING_TXS) {
    pendingTxsPoller.startPolling();
    droppedTxVerifier.start();
  }
  if (AZTEC_LISTEN_FOR_CHAIN_INFO) {
    chainInfoPoller.startPolling();
  }
  if (AZTEC_LISTEN_FOR_L2_TIPS) {
    l2TipsPoller.startPolling();
  }
};

export const getNodeInfo = () => nodeInfo;

export const pollerService: MicroserviceBaseSvc = {
  svcId: "POLLER",
  getConfigStr,
  init,
  // TODO: improve health check. Shutdown now exits the process instead of
  // leaving initialized-but-stopped pollers alive.
  health: () => nodeInfo !== undefined,
  // eslint-disable-next-line @typescript-eslint/require-await
  shutdown: async () => {
    pendingTxsPoller.stopPolling();
    blockPoller.stopPolling();
    chainInfoPoller.stopPolling();
    l2TipsPoller.stopPolling();
    droppedTxVerifier.stop();
  },
};
