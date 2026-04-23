import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ChicmozL2RpcNodeInfoEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { storeL2RpcNodeHealth } from "../../svcs/database/controllers/l2/index.js";

const onL2RpcNodeInfoEvent = async (event: ChicmozL2RpcNodeInfoEvent) => {
  logger.info(`🔍 L2RpcNodeInfo ${JSON.stringify(event)}`);
  await storeL2RpcNodeHealth(event.rpcNode);
};

export const l2RpcNodeInfoHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "l2RpcNodeInfoHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "L2_RPC_NODE_INFO_EVENT"),
  cb: onL2RpcNodeInfoEvent as (arg0: unknown) => Promise<void>,
};
