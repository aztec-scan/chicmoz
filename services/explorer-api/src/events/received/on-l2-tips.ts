import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL2TopicName,
  getConsumerGroupId,
  L2TipsEvent,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { controllers } from "../../svcs/database/index.js";

const onL2Tips = async (event: L2TipsEvent) => {
  logger.info(`Storing L2 tips observed at ${event.observedAt}`);
  await controllers.l2.tips.upsertTips(event);
};

export const l2TipsHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "l2TipsHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "L2_TIPS_EVENT"),
  cb: onL2Tips as (arg0: unknown) => Promise<void>,
};
