import { NodeInfo } from "@aztec/aztec.js";
import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { NODE_ENV, NodeEnv, jsonStringify } from "@chicmoz-pkg/types";
import {
  AZTEC_LISTEN_FOR_CHAIN_INFO,
  AZTEC_LISTEN_FOR_PENDING_TXS,
  AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT,
  getConfigStr,
} from "../../environment.js";
import { onL2RpcNodeError } from "../../events/emitted/index.js";
import { logger } from "../../logger.js";
import { ensureInitializedBlockHeights } from "../database/heights.controller.js";
import { init as initNetworkClient } from "./network-client/index.js";
import * as blockPoller from "./pollers/block_poller.js";
import * as chainInfoPoller from "./pollers/chain-info-poller.js";
import * as pendingTxsPoller from "./pollers/txs_poller.js";

let nodeInfo: NodeInfo;

export const init = async () => {
  if (NODE_ENV === NodeEnv.DEV) {
    onL2RpcNodeError({
      name: "Mocked Node Error",
      message: "Lorem ipsum dolor sit amet",
      cause: "UnknownCause",
      stack: new Error().stack?.toString() ?? "UnknownStack",
      data: {},
    });
  }
  await ensureInitializedBlockHeights();
  const initResult = await initNetworkClient();
  // Initialize with chainInfo and use type assertions to satisfy TypeScript
  nodeInfo = {
    nodeVersion: "unknown",
    l1ChainId: initResult.chainInfo.l1ChainId,
    rollupVersion: Number(initResult.chainInfo.rollupVersion), // Convert bigint to number
    l1ContractAddresses: initResult.chainInfo.l1ContractAddresses as unknown as NodeInfo["l1ContractAddresses"],
    protocolContractAddresses: initResult.chainInfo.protocolContractAddresses as unknown as NodeInfo["protocolContractAddresses"],
    enr: undefined, // Add missing required property
  };
  logger.info(`Aztec chain info: ${jsonStringify(initResult.chainInfo)}`);
  logger.info(`Aztec sequencer info: ${jsonStringify(initResult.sequencer)}`);
};

export const startPoller = async () => {
  await blockPoller.startPolling({
    forceStartFromProposedHeight:
      AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT,
    forceStartFromProvenHeight:
      AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT,
  });
  if (AZTEC_LISTEN_FOR_PENDING_TXS) {pendingTxsPoller.startPolling();}
  if (AZTEC_LISTEN_FOR_CHAIN_INFO) {chainInfoPoller.startPolling();}
};

export const getNodeInfo = () => nodeInfo;

export const pollerService: MicroserviceBaseSvc = {
  svcId: "POLLER",
  getConfigStr,
  init,
  // TODO: improve health check
  health: () => nodeInfo !== undefined,
  // eslint-disable-next-line @typescript-eslint/require-await
  shutdown: async () => {
    pendingTxsPoller.stopPolling();
    blockPoller.stopPolling();
    chainInfoPoller.stopPolling();
  },
};
