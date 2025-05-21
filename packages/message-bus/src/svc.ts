import { Logger } from "@chicmoz-pkg/logger-server";
import {
  type ChicmozMessageBusPayload,
  type ChicmozMessageBusTopic,
} from "@chicmoz-pkg/message-registry";
import {
  MicroserviceBaseSvcState,
  getSvcState,
  type MicroserviceBaseSvc,
} from "@chicmoz-pkg/microservice-base";
import { backOff } from "exponential-backoff";
import { KafkaJSProtocolError } from "kafkajs";
import { MessageBus } from "./class.js";
import {
  KAFKA_CONNECTION,
  KAFKA_SASL_PASSWORD,
  KAFKA_SASL_USERNAME,
  getConfigStr,
} from "./environment.js";

let mb: MessageBus;
const svcId = "MB";

// eslint-disable-next-line @typescript-eslint/require-await
export const init = async (instanceName: string, logger: Logger) => {
  mb = new MessageBus({
    logger,
    clientId: instanceName,
    connection: KAFKA_CONNECTION,
    saslConfig: {
      mechanism: "plain",
      username: KAFKA_SASL_USERNAME,
      password: KAFKA_SASL_PASSWORD,
    },
  });
};

const checkReady = () => {
  const state = getSvcState(svcId);
  if (state === MicroserviceBaseSvcState.SHUTTING_DOWN) {
    throw new Error("MessageBus is shutting down");
  }
  if (state === MicroserviceBaseSvcState.DOWN) {
    throw new Error("MessageBus is down");
  }
  // Use type assertion to avoid TypeScript's strict enum comparison
  if (state as MicroserviceBaseSvcState === MicroserviceBaseSvcState.INITIALIZING) {
    throw new Error("MessageBus is initializing");
  }
  return state;
};

export const publishMessage = async (
  topic: ChicmozMessageBusTopic,
  payload: ChicmozMessageBusPayload
) => {
  checkReady();
  await mb.publish<ChicmozMessageBusPayload>(topic, payload);
};

const _startSubscribe = async (eventHandler: EventHandler) => {
  checkReady();
  await mb.subscribe(eventHandler.groupId, eventHandler.topic, eventHandler.cb);
  await mb.runConsumer(eventHandler.groupId);
};

export type EventHandler = {
  groupId: string;
  topic: ChicmozMessageBusTopic;
  cb: (message: ChicmozMessageBusPayload) => Promise<void>;
};

export const startSubscribe = async (
  eventHandler: EventHandler,
  logger: Logger
) => {
  const tryIt = async () => await _startSubscribe(eventHandler);
  await backOff(tryIt, {
    maxDelay: 10000,
    retry: (e, attemptNumber: number) => {
      if ((e as Error).message === "MessageBus is not initialized") {
        logger.info("Trying to subscribe before MessageBus is initialized...");
        return false;
      }
      if (
        (e as KafkaJSProtocolError).message ===
        "This server does not host this topic-partition"
      ) {
        logger.info(
          "If this happens during the first mins of starting the cluster it's fine..."
        );
      } else {
        logger.warn(e);
      }
      // TODO: probably not infinite retries?
      logger.info(`Retrying attempt ${attemptNumber}...`);
      return true;
    },
  });
};

export const generateSvc: (
  instanceName: string,
  logger: Logger
) => MicroserviceBaseSvc = (instanceName, logger) => ({
  svcId,
  init: () => init(instanceName, logger),
  getConfigStr,
  health: () => getSvcState(svcId) === MicroserviceBaseSvcState.UP,
  shutdown: async () => {
    await mb.disconnect();
  },
});
