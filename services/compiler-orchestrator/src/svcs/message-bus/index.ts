import { generateSvc, publishMessage as pub } from "@chicmoz-pkg/message-bus";
import {
  type L2_MESSAGES,
  generateL2TopicName,
  type ChicmozMessageBusPayload,
} from "@chicmoz-pkg/message-registry";
import {
  INSTANCE_NAME,
  type MicroserviceBaseSvc,
} from "@chicmoz-pkg/microservice-base";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";

export const publishMessage = async (
  eventType: keyof L2_MESSAGES,
  message: ChicmozMessageBusPayload,
) => {
  const topic = generateL2TopicName(L2_NETWORK_ID, eventType);
  logger.info(`Publishing message to topic ${topic}`);
  await pub(topic, message);
};

export const messageBusService: MicroserviceBaseSvc = generateSvc(
  INSTANCE_NAME,
  logger,
);
