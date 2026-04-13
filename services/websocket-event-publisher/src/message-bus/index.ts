import { MBOptions, MessageBus } from "@chicmoz-pkg/message-bus";
import {
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { backOff } from "exponential-backoff";
import { SERVICE_NAME } from "../constants.js";
import {
  KAFKA_CONNECTION_URL,
  KAFKA_SASL_PASSWORD,
  KAFKA_SASL_USERNAME,
  L2_NETWORK_ID,
} from "../environment.js";
import { EventHandler } from "../event-handler/index.js";
import { logger } from "../logger.js";

let mb: MessageBus;
let isInitialized = false;
let isShutdown = false;

// eslint-disable-next-line @typescript-eslint/require-await
export const init = async () => {
  logger.info(`Initializing Kafka client...`);
  const mbConfig = {
    logger,
    clientId: SERVICE_NAME,
    connection: KAFKA_CONNECTION_URL,
    saslConfig: {
      mechanism: "plain",
      username: KAFKA_SASL_USERNAME,
      password: KAFKA_SASL_PASSWORD,
    },
  } as MBOptions;

  const gracefulShutdown = async () => {
    logger.info(`Shutting down Kafka client...`);
    isShutdown = true;
    await mb.disconnect();
  };

  mb = new MessageBus(mbConfig);
  isInitialized = true;

  return {
    id: "MB",
    shutdownCb: gracefulShutdown,
  };
};

const tryStartSubscribe = async ({
  consumerGroup,
  cb,
  topicBase,
}: EventHandler) => {
  if (!isInitialized) {throw new Error("MessageBus is not initialized");}
  if (isShutdown) {throw new Error("MessageBus is already shutdown");}

  const topic = generateL2TopicName(L2_NETWORK_ID, topicBase);
  const groupId = getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: consumerGroup,
  });
  logger.info(`Subscribing to topic ${topic}...`);
  await mb.subscribe(groupId, topic, cb);
  logger.info(`Started consuming from topic ${topic}`);
  await mb.runConsumer(groupId);
  logger.info(`Started consuming from topic ${topic}`);
};

export const startSubscribe = async (eventHandler: EventHandler) => {
  if (!isInitialized) {throw new Error("MessageBus is not initialized");}
  if (isShutdown) {throw new Error("MessageBus is already shutdown");}

  const tryIt = async () => await tryStartSubscribe(eventHandler);

  await backOff(tryIt, {
    maxDelay: 10000,
    retry: (e, attemptNumber: number) => {
      // TODO: probably not infinite retries?
      logger.warn(e);
      logger.info(`Retrying attempt ${attemptNumber}...`);
      return true;
    },
  });
};
