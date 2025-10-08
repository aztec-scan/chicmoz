import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ChicmozSentinelEvent,
  ChicmozSentinelHistoryEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { sentinel } from "../../svcs/database/controllers/index.js";

const onSentinelInfo = async (event: ChicmozSentinelEvent) => {
  logger.info(
    `🤖 Sentinel info event (${event.validatorStats.attester} attester)`,
  );
  await sentinel.storeSentinelValidator(event.validatorStats);
};

export const sentinelInfoHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "sentinelInfoHandler",
  }),
  topic: generateL2TopicName(
    L2_NETWORK_ID,
    "SENTINEL_INFO_EVENT",
  ),
  cb: onSentinelInfo as (arg0: unknown) => Promise<void>,
};

const onSentinelHistory = async (event: ChicmozSentinelHistoryEvent) => {
  logger.info(
    `🤖 Sentinel history event (${event.attester} attester)`,
  );
  await sentinel.storeSentinelValidatorHistoryEntry(event.attester, event.sentinelHistoryEntry);
};

export const sentinelHistoryHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "sentinelHistoryHandler",
  }),
  topic: generateL2TopicName(
    L2_NETWORK_ID,
    "SENTINEL_HISTORY_EVENT",
  ),
  cb: onSentinelHistory as (arg0: unknown) => Promise<void>,
};
