import { startSubscribe } from "../../svcs/message-bus/index.js";
import { blockHandler, catchupHandler } from "./on-block/index.js";
import { chainInfoHandler } from "./on-chain-info.js";
import { compileSourceResultHandler } from "./on-compile-source-result.js";
import { contractInstanceBalanceHandler } from "./on-contract-instance-balance.js";
import { droppedTxHandler } from "./on-dropped-txs.js";
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
import { l2RpcNodeInfoHandler } from "./on-rpc-node-info.js";
import { pendingTxHandler } from "./on-pending-txs.js";
import { stakingAssetInfoHandler } from "./on-staking-asset-info.js";

export const subscribeHandlers = async () => {
  await Promise.all([
    startSubscribe(chainInfoHandler),
    startSubscribe(l2RpcNodeInfoHandler),
    startSubscribe(l2RpcNodeAliveHandler),
    startSubscribe(l2RpcNodeErrorHandler),
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
  ]);
};
