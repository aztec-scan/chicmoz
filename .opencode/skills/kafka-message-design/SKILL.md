---
name: kafka-message-design
description: Step-by-step guide for designing and registering new Kafka topics and message types in Chicmoz. Covers message-registry structure, topic naming, schema definition, SASL auth context, and wiring producers and consumers.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: backend
---

## What I Do

- Guide you through adding a new Kafka topic and message type end-to-end
- Explain the `@chicmoz-pkg/message-registry` and `@chicmoz-pkg/message-bus` structure
- Provide topic naming conventions and schema patterns
- Walk through registering producers in publisher services and consumers in subscriber services

---

## Kafka Infrastructure Context

- **Broker**: Bitnami Kafka chart, 3 replicas in production (`chicmoz-prod` namespace)
- **Auth**: SASL/PLAIN — credentials injected via environment variables (never hardcoded)
- **Client library**: `kafkajs` (wrapped by `@chicmoz-pkg/message-bus`)
- **Schema approach**: TypeScript types enforced at compile time; no runtime schema registry (no Confluent Schema Registry)
- **Per-network isolation**: Each network (mainnet, testnet, devnet) runs its own Kafka cluster (or namespace-isolated topics) — topic names are prefixed or scoped per network via `L2_NETWORK_ID`

---

## Package Responsibilities

| Package                         | Role                                                 |
| ------------------------------- | ---------------------------------------------------- |
| `@chicmoz-pkg/message-registry` | Defines all topic names and TypeScript message types |
| `@chicmoz-pkg/message-bus`      | Kafka producer/consumer abstraction over `kafkajs`   |

**Rule**: All Kafka topic names and message shapes must be centralized in `@chicmoz-pkg/message-registry`. Services must not define their own topic strings or message types inline.

---

## Step-by-Step: Adding a New Kafka Topic

### 1. Define the message type in `@chicmoz-pkg/message-registry`

Navigate to `packages/message-registry/src/` and find the appropriate subdirectory (group by domain, e.g., `l2-blocks/`, `l1-contracts/`, `txs/`).

Create or extend a type file:

```typescript
// packages/message-registry/src/my-domain/my-event.ts

// Use `type`, not `interface`
export type MyEventMessage = {
  networkId: string;
  blockNumber: bigint;
  // ... your fields
};
```

**Type rules**:

- Use `type` not `interface`
- Use `bigint` for Aztec/Ethereum numeric values (block numbers, amounts, indices)
- Use `string` for hashes and addresses (not `0x${string}` unless you need viem compatibility)
- Avoid `any`; use `unknown` and narrow at the consumer

### 2. Register the topic name

In `packages/message-registry/src/topics.ts` (or equivalent index), add a const for the topic name:

```typescript
// Follow the naming pattern: <domain>-<event-name>
// Use lowercase kebab-case
export const MY_EVENT_TOPIC = "my-domain-my-event" as const;
```

**Topic naming convention**: `<domain>-<event>` in lowercase kebab-case.

- Examples: `l2-block-proven`, `l1-contract-deployed`, `tx-effect-added`
- The topic name is prefixed at runtime with the network ID by the message-bus layer — do not include network in the topic string itself

### 3. Export from the package index

```typescript
// packages/message-registry/src/index.ts
export type { MyEventMessage } from "./my-domain/my-event.js";
export { MY_EVENT_TOPIC } from "./topics.js";
```

**Use `.js` extensions** in TypeScript import paths (ES modules project-wide rule).

### 4. Build the package

```bash
# From repo root
yarn build:packages
# Or specifically
yarn workspace @chicmoz-pkg/message-registry build
```

### 5. Wire the producer (in the publishing service)

The producer is typically in `services/aztec-listener`, `services/ethereum-listener`, or `services/event-cannon`.

```typescript
import {
  MY_EVENT_TOPIC,
  type MyEventMessage,
} from "@chicmoz-pkg/message-registry";
import { getProducer } from "@chicmoz-pkg/message-bus";

// Produce a message
const producer = getProducer();
await producer.send<MyEventMessage>({
  topic: MY_EVENT_TOPIC,
  messages: [
    {
      value: {
        networkId: process.env.L2_NETWORK_ID!,
        blockNumber: block.number,
        // ... your fields
      },
    },
  ],
});
```

Check existing producers in `services/aztec-listener/src/` for the exact `message-bus` API shape — follow those patterns exactly.

### 6. Wire the consumer (in the subscribing service)

The consumer is typically in `services/explorer-api` or `services/websocket-event-publisher`.

```typescript
import {
  MY_EVENT_TOPIC,
  type MyEventMessage,
} from "@chicmoz-pkg/message-registry";
import { getConsumer } from "@chicmoz-pkg/message-bus";

// Subscribe to topic
const consumer = getConsumer({ groupId: "explorer-api-my-event-consumer" });
await consumer.subscribe({ topic: MY_EVENT_TOPIC });

await consumer.run({
  eachMessage: async ({ message }) => {
    const parsed = JSON.parse(
      message.value?.toString() ?? "{}",
    ) as MyEventMessage;
    // handle the message
    // Use @chicmoz-pkg/logger-server for logging, not console.log
  },
});
```

**Consumer group ID naming**: `<service-name>-<topic-short-name>-consumer` in kebab-case.

### 7. Handle deserialization errors

Always wrap message parsing in a try/catch — a malformed message should not crash the consumer process:

```typescript
eachMessage: async ({ message, topic, partition }) => {
  try {
    const parsed = JSON.parse(message.value?.toString() ?? "") as MyEventMessage;
    await handleMyEvent(parsed);
  } catch (err) {
    logger.error({ err, topic, partition }, "Failed to process Kafka message");
    // Do NOT re-throw — this would stop the consumer
  }
},
```

### 8. Add to `@chicmoz-pkg/message-registry` exports and rebuild

After changes to any shared package:

```bash
yarn build:packages
yarn build   # builds all services against the updated packages
yarn test    # verify nothing broke
```

---

## Checklist

- [ ] Message type defined with `type` (not `interface`) in `packages/message-registry/src/`
- [ ] Topic constant added in `topics.ts`, lowercase kebab-case, no network prefix
- [ ] Both exported from `packages/message-registry/src/index.ts` with `.js` extensions
- [ ] `yarn build:packages` passes cleanly
- [ ] Producer uses `@chicmoz-pkg/message-bus` — no raw `kafkajs` calls in service code
- [ ] Consumer has a unique `groupId` following `<service>-<topic>-consumer` naming
- [ ] Deserialization errors are caught and logged, not re-thrown
- [ ] `yarn build && yarn test` passes
- [ ] Logging uses `@chicmoz-pkg/logger-server`, not `console.log`
