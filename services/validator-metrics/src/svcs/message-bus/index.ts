import {
  EventHandler,
  generateSvc,
  publishMessage as pub,
  startSubscribe as sub,
} from "@chicmoz-pkg/message-bus";
import {
  ChicmozMessageBusPayload,
  L2_MESSAGES,
  generateL2TopicName,
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

export const publishMessageSync = (
  ...args: Parameters<typeof publishMessage>
) => {
  publishMessage(...args).catch((e) => logger.error((e as Error).message));
};
export const startSubscribe = async (eventHandler: EventHandler) => {
  await sub(eventHandler, logger);
};

export const messageBusService: MicroserviceBaseSvc = generateSvc(
  INSTANCE_NAME,
  logger,
);
