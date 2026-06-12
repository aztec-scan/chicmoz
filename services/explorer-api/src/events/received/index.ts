import { startSubscribe } from "../../svcs/message-bus/index.js";
import { blockHandler, catchupHandler } from "./on-block/index.js";
import { chainInfoHandler } from "./on-chain-info.js";
import { compileSourceResultHandler } from "./on-compile-source-result.js";
import { contractInstanceBalanceHandler } from "./on-contract-instance-balance.js";
import { droppedTxHandler } from "./on-dropped-txs.js";
import { l1FeeJuicePortalDepositHandler } from "./on-l1-fee-juice-portal-deposit.js";
import { l1L2ValidatorHandler } from "./on-l1-l2-validator.js";
import {
  l1GenericContractEventHandler,
  l1L2BlockProposedHandler,
  l1L2ProofVerifiedHandler,
} from "./on-l1-rollup-contract-events.js";
import {
  l2RpcNodeAliveHandler,
  l2RpcNodeErrorHandler,
} from "./on-l2-rpc-node.js";
import { l2TipsHandler } from "./on-l2-tips.js";
import { l2RpcNodeInfoHandler } from "./on-rpc-node-info.js";
import { pendingTxHandler } from "./on-pending-txs.js";
import { stakingAssetInfoHandler } from "./on-staking-asset-info.js";
import {
  governanceProposedHandler,
  governanceVoteCastHandler,
  governanceProposalExecutedHandler,
  governanceProposalDroppedHandler,
  governanceSignalCastHandler,
  governancePayloadSubmittableHandler,
  governancePayloadSubmittedHandler,
  governanceConfigUpdatedHandler,
  governanceProposerUpdatedHandler,
  governanceUriResolvedHandler,
} from "./on-governance-events.js";

export const subscribeHandlers = async () => {
  await Promise.all([
    startSubscribe(chainInfoHandler),
    startSubscribe(l2RpcNodeInfoHandler),
    startSubscribe(l2RpcNodeAliveHandler),
    startSubscribe(l2RpcNodeErrorHandler),
    startSubscribe(l2TipsHandler),
    startSubscribe(blockHandler),
    startSubscribe(catchupHandler),
    startSubscribe(pendingTxHandler),
    startSubscribe(droppedTxHandler),
    startSubscribe(contractInstanceBalanceHandler),
    startSubscribe(compileSourceResultHandler),
    startSubscribe(l1L2ValidatorHandler),
    startSubscribe(l1L2BlockProposedHandler),
    startSubscribe(l1L2ProofVerifiedHandler),
    startSubscribe(l1GenericContractEventHandler),
    startSubscribe(stakingAssetInfoHandler),
    startSubscribe(l1FeeJuicePortalDepositHandler),
    // Governance handlers
    startSubscribe(governanceProposedHandler),
    startSubscribe(governanceVoteCastHandler),
    startSubscribe(governanceProposalExecutedHandler),
    startSubscribe(governanceProposalDroppedHandler),
    startSubscribe(governanceSignalCastHandler),
    startSubscribe(governancePayloadSubmittableHandler),
    startSubscribe(governancePayloadSubmittedHandler),
    startSubscribe(governanceConfigUpdatedHandler),
    startSubscribe(governanceProposerUpdatedHandler),
    startSubscribe(governanceUriResolvedHandler),
  ]);
};
