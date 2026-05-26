# Aztec Listener Catchup Modes

Normal missing-block repair is request-driven:

1. `explorer-api` detects missing block ranges from its stored chain state.
2. `explorer-api` publishes bounded `L2_BLOCK_RANGE_REQUEST_EVENT` requests.
3. `aztec-listener` clamps each request to current Aztec node tips, fetches blocks through Aztec RPC, and republishes ordinary `CATCHUP_BLOCK_EVENT` messages.

## Full-sweep catchup

Full-sweep catchup is disabled by default. It is a deliberate fallback for cases where bounded reconciliation is not enough, such as:

- disaster recovery after a bad deployment or data loss;
- suspected historical gaps beyond the reconciliation scan window;
- Kafka retention or consumer-offset incidents that may have skipped old blocks.

Enable it only intentionally:

```yaml
- name: AZTEC_ENABLE_FULL_SWEEP_CATCHUP
  value: "true"
```

At startup the listener logs whether full-sweep catchup is enabled. When disabled, request-driven reconciliation is expected to be the primary repair path.

The old forced-start and processed-height override environment variables have been removed. For manual gap repair, publish a bounded `L2_BLOCK_RANGE_REQUEST_EVENT` for the missing range, or temporarily enable `AZTEC_ENABLE_FULL_SWEEP_CATCHUP` for disaster recovery.

Manual range repair should use the same BSON Kafka path as the services. From a shell with the normal Kafka env vars loaded and after `yarn build:packages`, publish one bounded request like this:

```sh
L2_NETWORK_ID=TESTNET FROM_BLOCK=100 TO_BLOCK=125 MAX_BLOCKS=26 yarn node --input-type=module -e 'import { MessageBus } from "./packages/message-bus/build/class.js"; import { generateL2TopicName } from "./packages/message-registry/build/aztec.js"; const logger = { info(){}, warn: console.warn, error: console.error }; const mb = new MessageBus({ logger, clientId: "manual-l2-block-range-request", connection: process.env.KAFKA_CONNECTION, saslConfig: { mechanism: "plain", username: process.env.KAFKA_SASL_USERNAME, password: process.env.KAFKA_SASL_PASSWORD } }); await mb.publish(generateL2TopicName(process.env.L2_NETWORK_ID, "L2_BLOCK_RANGE_REQUEST_EVENT"), { requestId: `manual-${Date.now()}`, requestedAt: Date.now(), reason: "manual", ranges: [{ from: Number(process.env.FROM_BLOCK), to: Number(process.env.TO_BLOCK) }], maxBlocks: Number(process.env.MAX_BLOCKS) }); await mb.disconnect();'
```

Set `L2_NETWORK_ID`, `FROM_BLOCK`, `TO_BLOCK`, and `MAX_BLOCKS` to the specific missing range. Keep manual requests small enough to fit the listener's configured range limits.
