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

Navigate to `packages/message-registry/src/` and update the correct network file:

- `aztec.ts` for L2 message types (`L2_MESSAGES`)
- `ethereum.ts` for L1 message types (`L1_MESSAGES`)

Create a new event payload type and add it to the corresponding message map:

```typescript
// packages/message-registry/src/aztec.ts

// Use `type`, not `interface`
export type MyEventMessage = {
  networkId: string;
  blockNumber: bigint;
  // ... your fields
};

export type L2_MESSAGES = {
  // ...
  MY_EVENT: MyEventMessage;
};
```

**Type rules**:

- Use `type` not `interface`
- Use `bigint` for Aztec/Ethereum numeric values (block numbers, amounts, indices)
- Use `string` for hashes and addresses (not `0x${string}` unless you need viem compatibility)
- Avoid `any`; use `unknown` and narrow at the consumer

### 2. Register the topic name

Topics are generated from the message-map keys; do not create ad-hoc topic constants.

```typescript
import { generateL2TopicName } from "@chicmoz-pkg/message-registry";

const topic = generateL2TopicName(L2_NETWORK_ID, "MY_EVENT");
```

For L1 topics use `generateL1TopicName(L2_NETWORK_ID, L1_NETWORK_ID, "MY_EVENT")`.

**Topic naming convention is code-generated**:

- L2: `${L2NetworkId}__${EventType}`
- L1: `${L2NetworkId}_${L1NetworkId}__${EventType}`

### 3. Export from the package index

```typescript
// packages/message-registry/src/index.ts
export type { MyEventMessage } from "./aztec.js";
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
  generateL2TopicName,
  type L2_MESSAGES,
  type MyEventMessage,
} from "@chicmoz-pkg/message-registry";
import { L2_NETWORK_ID } from "../environment.js";
import { publishMessage } from "../svcs/message-bus/index.js";

// Produce a message
const eventType: keyof L2_MESSAGES = "MY_EVENT";
// topic resolves to `${L2_NETWORK_ID}__MY_EVENT`
generateL2TopicName(L2_NETWORK_ID, eventType);

await publishMessage(eventType, {
  networkId: L2_NETWORK_ID,
  blockNumber: BigInt(block.number),
  // ... your fields
} satisfies MyEventMessage);
```

Check existing producers in `services/aztec-listener/src/` for the exact `message-bus` API shape — follow those patterns exactly.

### 6. Wire the consumer (in the subscribing service)

The consumer is typically in `services/explorer-api` or `services/websocket-event-publisher`.

```typescript
import {
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { type EventHandler } from "@chicmoz-pkg/message-bus";
import { L2_NETWORK_ID } from "../../environment.js";
import { SERVICE_NAME } from "../../constants.js";
import { startSubscribe } from "../../svcs/message-bus/index.js";

const handler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "myEventHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "MY_EVENT"),
  cb: async (payload) => {
    // payload is already deserialized by @chicmoz-pkg/message-bus (BSON)
    await handleMyEvent(payload);
  },
};

await startSubscribe(handler);
```

If you need event-specific typing inside `cb`, narrow/assert at the handler boundary:

```typescript
cb: async (payload) => {
  const event = payload as MyEventMessage;
  await handleMyEvent(event);
},
```

**Consumer group ID naming** must use `getConsumerGroupId()`:

```typescript
getConsumerGroupId({
  serviceName: "explorer-api",
  networkId: L2_NETWORK_ID,
  handlerName: "myEventHandler",
});
```

### 7. Handle deserialization errors

Message payloads are already BSON-deserialized before `cb` runs. Handle validation/processing errors in the callback so one bad event does not crash the consumer:

```typescript
cb: async (payload) => {
  try {
    const event = payload as MyEventMessage;
    await handleMyEvent(event);
  } catch (err) {
    logger.error({ err }, "Failed to process Kafka message");
    // Do not throw if you intentionally want to keep consuming
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
- [ ] Event key added to `L2_MESSAGES` (`aztec.ts`) or `L1_MESSAGES` (`ethereum.ts`)
- [ ] Topic generated with `generateL2TopicName(...)` or `generateL1TopicName(...)` (no raw topic strings)
- [ ] New payload types exported from `packages/message-registry/src/index.ts` with `.js` extensions
- [ ] `yarn build:packages` passes cleanly
- [ ] Producer uses service `publishMessage(...)` wrappers built on `@chicmoz-pkg/message-bus` (no raw `kafkajs` calls)
- [ ] Consumer uses `startSubscribe(...)` with `EventHandler` and `getConsumerGroupId(...)`
- [ ] Callback handles validation/processing errors; do not manually `JSON.parse` Kafka payloads
- [ ] `yarn build && yarn test` passes
- [ ] Logging uses `@chicmoz-pkg/logger-server`, not `console.log`
