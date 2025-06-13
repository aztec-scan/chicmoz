import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ChicmozL2RpcNodeAliveEvent,
  ChicmozL2RpcNodeErrorEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import {
  storeL2RpcNode,
  storeL2RpcNodeError,
} from "../../svcs/database/controllers/l2/index.js";

const onL2RpcNodeAlive = async (event: ChicmozL2RpcNodeAliveEvent) => {
  logger.info(`✔ L2RpcNodeAlive ${JSON.stringify(event)}`);
  await storeL2RpcNode(event.rpcName, event.rpcUrl);
};

const onL2RpcNodeError = async (event: ChicmozL2RpcNodeErrorEvent) => {
  logger.info(`❌ L2RpcNodeError ${JSON.stringify(event)}`);
  await storeL2RpcNodeError(event.nodeError);
};

export const l2RpcNodeAliveHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "l2RpcNodeAliveHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "L2_RPC_NODE_ALIVE_EVENT"),
  cb: onL2RpcNodeAlive as (arg0: unknown) => Promise<void>,
};

export const l2RpcNodeErrorHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "l2RpcNodeErrorHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "L2_RPC_NODE_ERROR_EVENT"),
  cb: onL2RpcNodeError as (arg0: unknown) => Promise<void>,
};
