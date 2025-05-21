// TODO: revise file name and perhaps also set-up?
import { Logger } from "@chicmoz-pkg/logger-server";
import autoBind from "auto-bind";
import { BSON } from "bson";
import kafkaJS, {
  Consumer,
  Kafka,
  KafkaConfig,
  Message,
  Producer,
  SASLOptions,
} from "kafkajs";

export { SASLOptions } from "kafkajs";

export interface MBOptions {
  logger: Logger;
  clientId: string;
  connection: string;
  saslConfig: SASLOptions;
  ssl?: boolean;
}
export type MBConsumer = {
  consumer: Consumer;
  topicCallbacks: Record<string, (event: object) => Promise<void>>;
};

export class MessageBus {
  #client: Kafka;
  #producer: Producer | undefined;
  #producerConnectingPromise: Promise<void> | undefined;
  #consumers: Record<string, MBConsumer | undefined>;
  #shutdown = false;
  logger: Logger;

  constructor(options: MBOptions) {
    this.logger = options.logger;
    const kafkaConfig: KafkaConfig = {
      clientId: options.clientId,
      brokers: options.connection.split(","),
      sasl: options.saslConfig,
      logCreator: () => {
        return ({ log, label }) => {
          const { message, error, stack, retryCount } = log;
          if (stack) {
            this.logger.error(`Kafka: ${stack}`);
          } else if (error) {
            this.logger.error(`Kafka: ${error} (message: ${message})`);
          } else if (retryCount) {
            this.logger.warn(`Kafka: ${message} (retrying ${retryCount}...)`);
          } else {
            this.logger.info(`Kafka[${label}]: ${message}`);
          }
        };
      },
    };
    if (options.ssl) {
      kafkaConfig.ssl = true;
    }

    this.#client = new Kafka(kafkaConfig);
    this.#consumers = {};

    autoBind(this);
  }

  private shouldCrash(error: Error): boolean {
    const isNonRetriableError =
      error instanceof kafkaJS.KafkaJSNonRetriableError;
    const isNumberOfRetriesExceeded =
      error instanceof kafkaJS.KafkaJSNumberOfRetriesExceeded;
    const isCoordinatorError =
      error instanceof kafkaJS.KafkaJSGroupCoordinatorNotFound;

    return (
      isNonRetriableError && !isNumberOfRetriesExceeded && !isCoordinatorError
    );
  }

  private async ensureProducerConnected() {
    if (!this.#producerConnectingPromise) {
      this.#producer = this.#client.producer();
      this.#producerConnectingPromise = this.#producer.connect();
    }
    await this.#producerConnectingPromise;
  }

  private async connectConsumer(groupId: string) {
    this.#consumers[groupId] = {
      consumer: this.#client.consumer({ groupId }),
      topicCallbacks: {},
    };
    await this.#consumers[groupId]!.consumer.connect();
  }

  async publish<T>(topic: string, ...messages: T[]) {
    if (this.#shutdown) {
      throw new Error("MessageBus is already shutdown");
    }

    await this.ensureProducerConnected();

    const kafkaMessages: Message[] = [];
    for (const m of messages) {
      // Serialize the data and create a Buffer
      const serialized = BSON.serialize({ data: m });
      // Ensure we're using a Buffer as required by the Message interface
      kafkaMessages.push({ value: Buffer.from(serialized) });
    } // double check

    await this.#producer!.send({ topic, messages: kafkaMessages });
  }

  // TODO: https://kafka.js.org/docs/consuming; probably need to look into manually committing instead in future
  async subscribe<T>(
    groupId: string,
    topic: string,
    cb: ((event: T) => Promise<void>) | ((event: T) => void)
  ) {
    this.logger.info(`Kafka (sub): connecting to consumer group ${groupId}`);
    if (!this.#consumers[groupId]) {
      await this.connectConsumer(groupId);
    }

    this.logger.info(`Kafka (sub): subscribing to topic ${topic}`);
    await this.#consumers[groupId]!.consumer.subscribe({
      topic,
      fromBeginning: true,
    });
    this.#consumers[groupId]!.topicCallbacks = {
      ...this.#consumers[groupId]?.topicCallbacks,
      [topic]: cb as unknown as (event: object) => Promise<void>,
    };
  }

  private nonRetriableWrapper(groupId: string) {
    // TODO: we should do this without promise
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.#consumers[groupId]!.consumer.on("consumer.crash", async (payload) => {
      if (this.shouldCrash(payload.payload.error)) {
        this.logger.error(
          `FATAL: not recoverable error: ${JSON.stringify(
            payload.payload.error
          )}`
        );
        process.kill(process.pid, "SIGTERM");
        return;
      }

      const currentTopics = this.#consumers[groupId]!.topicCallbacks;
      try {
        await this.#consumers[groupId]!.consumer.disconnect();
      } finally {
        // TODO: we should do this without promise
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(async () => {
          await this.connectConsumer(groupId);
          await Promise.all(
            Object.keys(currentTopics).map(async (topicName) => {
              await this.subscribe(
                groupId,
                topicName,
                currentTopics[topicName]
              );
            })
          );
          await this.runConsumer(groupId);
        }, 5000);
      }
    });
  }

  async runConsumer(groupId: string) {
    if (!this.#consumers[groupId]) {
      throw new Error(`No consumer exists with groupId: ${groupId}`);
    }

    this.nonRetriableWrapper(groupId);

    await this.#consumers[groupId]!.consumer.run({
      eachMessage: async ({ topic, message }) => {
        // this.logger.info(
        //   `Kafka: received message from topic ${topic} in group ${groupId}`
        // );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        // Convert Buffer to Uint8Array before deserializing
        const messageValue = message.value!;
        const valueAsUint8Array = messageValue instanceof Buffer 
          ? new Uint8Array(messageValue) 
          : typeof messageValue === 'string' 
            ? new TextEncoder().encode(messageValue)
            : new Uint8Array(0);
        // Add proper type assertion to satisfy the linter
        const deserializedObj = BSON.deserialize(valueAsUint8Array) as { data: unknown };
        const data = deserializedObj.data;
        const cb = this.#consumers[groupId]?.topicCallbacks[topic];
        if (cb) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await cb(data);
          } catch (e) {
            if (e instanceof Error) {
              this.logger.error(
                `Provided callback for topic ${topic} failed: ${e.stack}`
              );
            } else {
              this.logger.warn(
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `Provided callback for topic ${topic} failed with non-Error: ${e}`
              );
            }
          }
        }
      },
    });
  }

  async disconnect() {
    this.#shutdown = true;
    await this.#producer?.disconnect();
    for (const consumer of Object.values(this.#consumers)) {
      await consumer?.consumer.disconnect();
    }
  }
}
