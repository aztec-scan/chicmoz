import { startSubscribe } from "../../svcs/message-bus/index.js";
import { blockHandler, catchupHandler } from "./on-block/index.js";
import { chainInfoHandler } from "./on-chain-info.js";
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
import { pendingTxHandler } from "./on-pending-txs.js";
import { sequencerInfoHandler } from "./on-sequencer-info.js";

export const subscribeHandlers = async () => {
  await Promise.all([
    startSubscribe(chainInfoHandler),
    startSubscribe(sequencerInfoHandler),
    startSubscribe(l2RpcNodeAliveHandler),
    startSubscribe(l2RpcNodeErrorHandler),
    startSubscribe(blockHandler),
    startSubscribe(catchupHandler),
    startSubscribe(pendingTxHandler),
    startSubscribe(l1L2ValidatorHandler),
    startSubscribe(l1L2BlockProposedHandler),
    startSubscribe(l1L2ProofVerifiedHandler),
    startSubscribe(l1GenericContractEventHandler),
  ]);
};
