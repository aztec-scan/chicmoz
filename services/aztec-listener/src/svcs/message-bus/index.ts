import { generateSvc, publishMessage as pub } from "@chicmoz-pkg/message-bus";
import {
  L2_MESSAGES,
  generateL2TopicName,
} from "@chicmoz-pkg/message-registry";
import {
  INSTANCE_NAME,
  type MicroserviceBaseSvc,
} from "@chicmoz-pkg/microservice-base";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";

export const publishMessage = async <K extends keyof L2_MESSAGES>(
  eventType: K,
  message: L2_MESSAGES[K],
) => {
  const topic = generateL2TopicName(L2_NETWORK_ID, eventType);
  logger.info(`Publishing message to topic ${topic}`);
  await pub(topic, message);
};

export const publishMessageSync = (
  ...args: Parameters<typeof publishMessage>
) => {
  publishMessage(...args).catch((e) => logger.error((e as Error).message));
};

export const messageBusService: MicroserviceBaseSvc = generateSvc(
  INSTANCE_NAME,
  logger,
);
