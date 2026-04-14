---
name: aztec-types-guide
description: Reference for working with Aztec SDK types and the @chicmoz-pkg/types package in Chicmoz. Covers pinned package versions, key type patterns for blocks, transactions, contracts, and notes on viem compatibility.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: backend
---

## What I Do

- Explain the Aztec SDK type landscape used in Chicmoz
- Reference pinned package versions and where they are used
- Describe common type patterns for blocks, transactions, and contracts
- Clarify how `@chicmoz-pkg/types` relates to `@aztec/*` SDK types
- Note compatibility constraints with `viem` and `@defi-wonderland/aztec-standards`

---

## Pinned Package Versions

All `@aztec/*` packages are pinned globally via Yarn resolutions in the root `package.json`. **Do not change individual service package.json versions without updating resolutions too.**

### Current pins (as of last update)

| Package                     | Version (main/production) | Version (production-devnet) |
| --------------------------- | ------------------------- | --------------------------- |
| `@aztec/aztec.js`           | `4.1.1`                   | `4.0.3`                     |
| `@aztec/stdlib`             | `4.1.1`                   | `4.0.3`                     |
| `@aztec/accounts`           | `4.1.1`                   | `4.0.3`                     |
| `@aztec/bb.js`              | `4.1.1`                   | `4.0.3`                     |
| `@aztec/bb-prover`          | `4.1.1`                   | `4.0.3`                     |
| `@aztec/builder`            | `4.1.1`                   | `4.0.3`                     |
| `@aztec/constants`          | `4.1.1`                   | `4.0.3`                     |
| `@aztec/entrypoints`        | `4.1.1`                   | `4.0.3`                     |
| `@aztec/ethereum`           | `4.1.1`                   | `4.0.3`                     |
| `@aztec/foundation`         | `4.1.1`                   | `4.0.3`                     |
| `@aztec/l1-artifacts`       | `4.1.1`                   | `4.0.3`                     |
| `@aztec/noir-contracts.js`  | `4.1.1`                   | `4.0.3`                     |
| `@aztec/protocol-contracts` | `4.1.1`                   | `4.0.3`                     |
| `@aztec/pxe`                | `4.1.1`                   | `4.0.3`                     |
| `@aztec/simulator`          | `4.1.1`                   | `4.0.3`                     |
| `viem`                      | `2.20.0`                  | `2.20.0`                    |

### Additional non-Aztec dependency

`@defi-wonderland/aztec-standards@4.0.0-devnet.2-patch.1` is used by `services/event-cannon` and `services/explorer-api`. This is a standards library pinned to a devnet-era patch version — treat it as stable unless there is a specific reason to upgrade.

---

## Where `@aztec/*` Is Used Per Service

| Service                      | Direct `@aztec/*` deps                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `services/aztec-listener`    | `@aztec/aztec.js`, `@aztec/stdlib`                                                                                       |
| `services/ethereum-listener` | `@aztec/aztec.js`, `@aztec/l1-artifacts`                                                                                 |
| `services/explorer-api`      | `@aztec/aztec.js`, `@aztec/protocol-contracts`, `@aztec/stdlib`                                                          |
| `services/event-cannon`      | `@aztec/accounts`, `@aztec/aztec.js`, `@aztec/ethereum`, `@aztec/l1-artifacts`, `@aztec/noir-contracts.js`, `@aztec/pxe` |
| `packages/types`             | **None** — uses only `zod` for validation                                                                                |

`packages/types` deliberately has no `@aztec/*` dependencies. It defines the Chicmoz-internal type system using plain TypeScript types (validated with Zod), keeping the shared type layer independent of the Aztec SDK version.

---

## `@chicmoz-pkg/types` — Chicmoz Type System

This package (`packages/types/`) is the **source of truth for all cross-service types** in Chicmoz. It defines:

- L2 block types (headers, body, transaction effects)
- L2 transaction types (pending, mined, dropped)
- L1 contract types (registered classes, deployed instances)
- Network configuration types
- API response shapes (used by both `explorer-api` and `explorer-ui`)

### When to add types here

Add to `@chicmoz-pkg/types` when:

- The type is shared between two or more services (e.g., `explorer-api` produces it, `explorer-ui` consumes it)
- The type is used in a Kafka message (define it here, import it into `@chicmoz-pkg/message-registry`)
- The type represents an Aztec domain concept (block, tx, contract) that you want decoupled from the SDK version

Do NOT add to `@chicmoz-pkg/types`:

- Service-internal implementation types (keep those in the service)
- Types that are only used in one service

### Zod usage pattern

`packages/types` uses Zod for runtime validation at service boundaries (e.g., validating Aztec node RPC responses before storing to DB):

```typescript
import { z } from "zod";

// Define with Zod schema
export const L2BlockSchema = z.object({
  hash: z.string(),
  number: z.bigint(),
  timestamp: z.bigint(),
  // ...
});

// Derive TypeScript type from schema
export type L2Block = z.infer<typeof L2BlockSchema>;
```

Use `z.bigint()` for Aztec/Ethereum numeric values — do not coerce to `number` (blocks and amounts exceed `Number.MAX_SAFE_INTEGER`).

---

## Key Type Patterns

### Block numbers and hashes

```typescript
// Block numbers are bigint in Aztec — always use bigint, never number
type BlockNumber = bigint;

// Hashes are hex strings (not Buffer or Uint8Array)
type Fr = string; // Field element as hex string
type AztecAddress = string;
type EthAddress = string;
```

### Working with `@aztec/aztec.js` types directly (in services)

When interfacing directly with the Aztec node RPC in `aztec-listener`:

```typescript
import { type L2Block } from "@aztec/aztec.js";

// Aztec SDK types are complex — extract only what you need and map to @chicmoz-pkg/types
// Do not pass raw SDK types through Kafka; serialize to plain objects first
```

**Pattern**: Always map Aztec SDK types to Chicmoz internal types (`@chicmoz-pkg/types`) before publishing to Kafka or storing in the DB. This isolates SDK version changes to the listener services.

### L1 contract types (via `@aztec/l1-artifacts`)

```typescript
import { type L1ContractAddresses } from "@aztec/aztec.js";
```

Used in `ethereum-listener` to track L1 contract deployments. Map to `@chicmoz-pkg/types` definitions before publishing.

### Protocol contracts (via `@aztec/protocol-contracts`)

Used in `explorer-api` for contract class/instance lookups. These are Aztec-native contract artifacts — version-locked to the SDK version.

---

## viem Compatibility

`viem` is pinned to `2.20.0` project-wide. It is used in:

- `services/ethereum-listener`: listening to L1 events via HTTP/WS RPC
- `services/event-cannon`: L1 interactions (fee juice, dev coin portals)
- `@aztec/ethereum`: internally uses viem

**Do not upgrade viem** independently — it must stay compatible with the `@aztec/*` SDK version. When bumping Aztec, check that the new Aztec version's internal viem dependency matches the pinned version.

---

## Type Safety Rules

- **No `any`**: Use `unknown` and narrow with Zod or type guards
- **No `as` casting** without a comment explaining why it's safe
- **`type` over `interface`**: Project-wide rule — use `type Foo = { ... }` everywhere
- **Strict null checks**: Enabled project-wide; always handle `null` and `undefined` explicitly
- **BigInt serialization**: `bigint` does not serialize with `JSON.stringify` — use `.toString()` or a custom replacer when sending over HTTP or Kafka
  ```typescript
  // Safe bigint serialization
  JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  ```

---

## Upgrading Aztec SDK — Impact on Types

When bumping `@aztec/*` versions:

1. Check the Aztec changelog for breaking type changes in `L2Block`, `TxEffect`, `ContractClassPublic`, etc.
2. Update mappings in `services/aztec-listener/src/` where Aztec SDK types are converted to Chicmoz internal types
3. Update `packages/types/` if the Aztec domain model changed (new fields, renamed fields)
4. Update `services/event-cannon/Dockerfile.compile-contracts` to match: `FROM aztecprotocol/aztec:NEW_VERSION`
5. Run `yarn build:packages && yarn build && yarn test` to catch type errors early
6. The devnet branch may be on a different version — apply changes independently per branch

See the `git-release` skill for the full Aztec version bump procedure.
