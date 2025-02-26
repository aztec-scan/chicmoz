import {
  ChicmozL2BlockFinalizationUpdateEvent,
  L2_MESSAGES,
  type ChicmozMessageBusPayload,
  type PendingTxsEvent,
} from "@chicmoz-pkg/message-registry";
import { onBlock } from "./on-block.js";
import { onL2BlockFinalizationUpdate } from "./on-l2-block-finalization-update.js";
import { onPendingTxs } from "./on-pending-txs.js";

export type EventHandler = {
  consumerGroup: string;
  cb: (event: ChicmozMessageBusPayload) => Promise<void>;
  topicBase: keyof L2_MESSAGES;
};

export const blockHandler: EventHandler = {
  consumerGroup: "block",
  cb: onBlock as (arg0: unknown) => Promise<void>,
  topicBase: "NEW_BLOCK_EVENT",
};

export const pendingTxHandler: EventHandler = {
  consumerGroup: "pendingTx",
  cb: ((event: PendingTxsEvent) => {
    return onPendingTxs(event);
  }) as (arg0: unknown) => Promise<void>,
  topicBase: "PENDING_TXS_EVENT",
};

export const l2BlockFinalizationHandler: EventHandler = {
  consumerGroup: "blockFinalization",
  cb: ((event: ChicmozL2BlockFinalizationUpdateEvent) => {
    return onL2BlockFinalizationUpdate(event);
  }) as (arg0: unknown) => Promise<void>,
  topicBase: "L2_BLOCK_FINALIZATION_UPDATE_EVENT",
};
