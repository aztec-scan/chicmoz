---
name: aztecscan
description: Foundation skill for the Chicmoz (AztecScan) monorepo. Load this before any other skill when working in this repository. Covers monorepo layout, all services, all shared packages, inter-service communication, key design decisions, and where to find things.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: all
---

## What This Skill Does

Gives you instant orientation to the Chicmoz (AztecScan) codebase — what lives where, how services connect, and the design rules you must not violate. Load this first; then load the relevant specialist skill for the specific task.

---

## 1. Stack at a Glance

| Concern          | Technology                                                                     |
| ---------------- | ------------------------------------------------------------------------------ |
| Monorepo         | Yarn 4 (Berry), `node-modules` linker, workspaces: `services/*` + `packages/*` |
| Language         | TypeScript 5.8 ESM throughout — all imports require `.js` extensions           |
| Backend services | Node.js, Express 4, Drizzle ORM                                                |
| Data validation  | Zod — schemas defined first, types inferred via `z.infer<>`                    |
| Async messaging  | Kafka (KafkaJS wrapped by `@chicmoz-pkg/message-bus`), BSON serialization      |
| Databases        | PostgreSQL (Drizzle ORM), Redis (caching + rate limiting)                      |
| L2 chain client  | `@aztec/aztec.js` — pinned at root via `resolutions`                           |
| L1 chain client  | `viem` — pinned at root                                                        |
| Frontend         | React 18, Vite, TailwindCSS, TanStack Router/Query/Table, shadcn/ui            |
| Real-time        | Native `WebSocket` (server: `ws` library; client: browser WebSocket API)       |
| Infrastructure   | Kubernetes (DigitalOcean), Skaffold, GitHub Actions                            |
| Logging          | Winston via `@chicmoz-pkg/logger-server` — **no `console.log` anywhere**       |

---

## 2. Monorepo Layout

```
aztecscan/
├── services/               8 runnable services (Node.js + 1 React SPA)
├── packages/               11 shared internal packages (@chicmoz-pkg/*)
├── k8s/                    K8s manifests + Skaffold configs
│   ├── local/              Minikube dev configs
│   ├── staging/            Staging configs (self-hosted runner)
│   └── production/         Production configs (mainnet / devnet / testnet)
├── scripts/                Bash ops scripts (deploy, scale, DB backup, registry cleanup)
├── .github/workflows/      6 GitHub Actions workflows
├── .opencode/              AI agent + skill definitions
│   ├── agents/             Specialist subagent configs (dev, devops, frontend, etc.)
│   └── skills/             Procedural skill guides (this file + kafka, react, aztec-types, etc.)
├── k6/                     k6 load test scripts
├── data/                   Local seed / test data
├── Dockerfile              Root base image — builds chicmoz-base (used by all service images)
├── package.json            Workspace root — global @aztec/* + viem resolutions
├── .yarnrc.yml             Yarn 4 config (node-modules linker, multi-arch)
├── .chicmoz-example.env    Committed env template
└── .chicmoz.env            Real secrets — gitignored, never commit
```

---

## 3. Services

| Service                     | Role                                                                                               | Key Deps                                                                          | Own DB?                             | Kafka                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `aztec-listener`            | Polls Aztec L2 nodes for blocks, pending/dropped txs, sequencer info                               | `@aztec/aztec.js`, Drizzle, Bottleneck                                            | Yes (`aztec_listener_{network}`)    | **Publishes** 8 event types                                                                   |
| `ethereum-listener`         | Watches Ethereum L1 for rollup contract events (block proposed, proof verified, validator changes) | `viem`, `@aztec/l1-artifacts`, Drizzle                                            | Yes (`ethereum_listener_{network}`) | **Publishes** 6 event types                                                                   |
| `explorer-api`              | Central REST API — consumes all Kafka events, stores in DB, serves UI + external consumers         | Express, Drizzle, Redis, `@aztec/aztec.js`, Zod, `@anatine/zod-openapi`           | Yes (`explorer_api_{network}`)      | **Subscribes** to all 14 event types; also **publishes** `L2_BLOCK_FINALIZATION_UPDATE_EVENT` |
| `websocket-event-publisher` | Bridges Kafka → WebSocket — broadcasts live block/tx updates to browser clients                    | `ws@8`                                                                            | No                                  | **Subscribes** to 3 event types                                                               |
| `explorer-ui`               | Public-facing React SPA block explorer                                                             | React 18, Vite, TanStack Router/Query/Table, Axios, Zod                           | No                                  | No                                                                                            |
| `auth`                      | API key validation gateway — rate limiting, key lifecycle management. **Mainnet only.**            | Express, Sequelize, Redis, `express-oauth2-jwt-bearer`                            | Yes (`auth`, `apikey`)              | No                                                                                            |
| `event-cannon`              | Dev/test-only synthetic transaction firer. **Never deployed in production.**                       | `@aztec/accounts`, `@aztec/noir-contracts.js`, `@defi-wonderland/aztec-standards` | No                                  | No                                                                                            |
| `compiler-orchestrator`     | Stub — no source code present                                                                      | —                                                                                 | No                                  | No                                                                                            |

---

## 4. Shared Packages (`@chicmoz-pkg/*`)

| Package                 | What It Provides                                                                                                                                                             | Primary Consumers                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `types`                 | All domain Zod schemas + inferred TS types: blocks, tx effects, contracts, validators, pending txs, WebSocket message types, network ID enums, `jsonStringify` (BigInt-safe) | All services + `explorer-ui`                                                       |
| `message-registry`      | Kafka topic name generators (`generateL2TopicName`, `generateL1TopicName`), all message payload type maps (`L2_MESSAGES`, `L1_MESSAGES`), `getConsumerGroupId()`             | `aztec-listener`, `ethereum-listener`, `explorer-api`, `websocket-event-publisher` |
| `message-bus`           | Kafka abstraction: `MessageBus` class, `publishMessage()`, `startSubscribe()`, BSON serialization, auto-reconnect, heartbeat-before-handler pattern                          | All Kafka-using services                                                           |
| `microservice-base`     | Service bootstrap framework: `startMicroservice()`, `shutdownMicroservice()`, `MicroserviceBaseSvc` interface, SIGINT/SIGTERM handlers, health check primitives              | All backend services                                                               |
| `postgres-helper`       | Drizzle ORM + `pg` setup, `migrateDb()` runner, `generateSvc()` factory                                                                                                      | `aztec-listener`, `ethereum-listener`, `explorer-api`, `auth`                      |
| `redis-helper`          | Redis client wrapper, `generateSvc()` factory, connection lifecycle                                                                                                          | `explorer-api`, `auth`                                                             |
| `backend-utils`         | `parseBlock()` (deserializes Aztec block from hex buffer), DB utils, time utilities                                                                                          | `aztec-listener`, `explorer-api`                                                   |
| `logger-server`         | Winston structured logger, `Logger` type                                                                                                                                     | All backend services                                                               |
| `error-middleware`      | Express error handler: ZodError → 400, Auth0 JWT errors → 401                                                                                                                | `explorer-api`, `auth`                                                             |
| `auth0-middleware`      | Auth0 JWT Bearer verification middleware for Express routes                                                                                                                  | `explorer-api`, `auth`                                                             |
| `contract-verification` | `verifyArtifact()`, `verifyInstanceDeployment()` — validates deployed contract matches known artifact                                                                        | `explorer-api`                                                                     |

---

## 5. Inter-Service Communication

```
Aztec L2 nodes  ──── HTTP JSON-RPC (aztec.js) ────►  aztec-listener
Ethereum L1     ──── HTTP/WS RPC (viem)        ────►  ethereum-listener

aztec-listener       ──► Kafka (BSON): NEW_BLOCK_EVENT, CATCHUP_BLOCK_EVENT,
                                        PENDING_TXS_EVENT, DROPPED_TXS_EVENT,
                                        CHAIN_INFO_EVENT, SEQUENCER_INFO_EVENT,
                                        L2_RPC_NODE_ERROR_EVENT, L2_RPC_NODE_ALIVE_EVENT

ethereum-listener    ──► Kafka (BSON): L1_L2_BLOCK_PROPOSED_EVENT, L1_L2_PROOF_VERIFIED_EVENT,
                                        L1_L2_VALIDATOR_EVENT, L1_GENERIC_CONTRACT_EVENT,
                                        CONNECTED_TO_L1_EVENT

Kafka ──► explorer-api          (subscribes to all of the above)
      ──► websocket-event-publisher  (NEW_BLOCK_EVENT, PENDING_TXS_EVENT,
                                      L2_BLOCK_FINALIZATION_UPDATE_EVENT)

explorer-api         ──► Kafka (BSON): L2_BLOCK_FINALIZATION_UPDATE_EVENT
                                        (published when L1 proof arrives and updates block status)

websocket-event-publisher  ──► WebSocket (JSON, bigints → strings)  ──►  explorer-ui (browser)

explorer-ui  ──► HTTP REST (Axios)  ──►  auth (mainnet) / explorer-api (direct on devnet/testnet)
auth         ──► HTTP proxy         ──►  explorer-api
```

**Kafka topic naming**: `{L2NetworkId}__{EventType}` for L2 (e.g. `MAINNET__NEW_BLOCK_EVENT`), `{L2NetworkId}_{L1NetworkId}__{EventType}` for L1 (e.g. `MAINNET_ETH_MAINNET__L1_L2_BLOCK_PROPOSED_EVENT`). Each network's services consume only their own prefixed topics — mainnet, testnet, and devnet are isolated on the same Kafka cluster.

**Consumer group naming**: `{serviceName}_{networkId}_{handlerName}` — generated by `getConsumerGroupId()` from `@chicmoz-pkg/message-registry`.

**Kafka message serialization**: BSON (not JSON) via the `bson` library. Block binary data is hex-encoded (`block.toBuffer().toString('hex')`) before being placed in the Kafka payload, then decoded on the consumer side via `parseBlock()` in `@chicmoz-pkg/backend-utils`.

---

## 6. Key Design Rules

These are non-obvious decisions already made in this codebase. Do not deviate from them.

### TypeScript / Module System

- **ESM throughout** — all packages use `"type": "module"`. Import paths must include `.js` extensions even when the source file is `.ts`:
  ```ts
  import { something } from "./utils.js"; // correct — even for .ts source
  ```
- **No default exports** — enforced by ESLint (`import/no-default-export`). Always use named exports.
- **`type` imports** — use the `type` keyword for type-only imports to keep bundles clean:
  ```ts
  import { type ChicmozL2Block } from "@chicmoz-pkg/types";
  ```

### Types & Validation

- **Zod schemas first** — define a Zod schema, then derive the TypeScript type with `z.infer<>`. Never define domain types manually.
- **`@chicmoz-pkg/types` is the single source of truth** for all shared domain types and schemas. Do not redefine types locally in a service or in `explorer-ui`.
- **Validate at the boundary** — API responses in `explorer-ui` are Zod-parsed by `validateResponse()` before entering React Query. Kafka message payloads are typed by the `@chicmoz-pkg/message-registry` type map.

### Kafka

- **BSON, not JSON** — Kafka messages are BSON-serialized by `@chicmoz-pkg/message-bus`. Never call `JSON.stringify` on a Kafka payload.
- **Heartbeat before long DB operations** — call the Kafka heartbeat function before any DB write inside a consumer handler to prevent session timeout rebalances.
- **Always use `getConsumerGroupId()`** from `@chicmoz-pkg/message-registry` to generate consumer group IDs.

### Database

- **Drizzle ORM only** — no raw SQL queries. Schema definitions live in `svcs/database/schema/` within each service.
- **Per-service, per-network databases** — naming convention: `{service}_{network}` (e.g. `explorer_api_mainnet`, `aztec_listener_devnet`).
- **Migrations via init container** — `yarn migrate` runs in a K8s init container before the service starts. Controlled by `TOTAL_DB_RESET` env var (destructive — warn before suggesting this).

### Logging

- **Winston only via `@chicmoz-pkg/logger-server`** — never use `console.log`, `console.error`, or `console.warn` in service code.

### Frontend (`explorer-ui`)

- **Build-time env vars** — all `VITE_*` variables are baked into the Docker image at build time. There is no runtime env injection. To change a URL you must rebuild the image.
- **Per-network images** — each network (mainnet/testnet/devnet) has its own Docker image with different baked-in `VITE_API_URL`, `VITE_WS_URL`, and `VITE_L2_NETWORK_ID`.
- **React Query for all server state** — no Redux, Zustand, or Context for server data. See the `react-best-practices` skill for full frontend conventions.

### Multi-Branch / Multi-Network Model

- Each Aztec network has its own long-lived git branch: `production` (mainnet), `production-testnet`, `production-devnet`.
- Each branch independently tracks its own `@aztec/*` package versions (currently mainnet = `4.1.1`, devnet = `4.0.3`).
- Features branch from `main`, merge to `main` via PR, then get promoted to production branches via merge commits.

### Service Lifecycle

- All services use `startMicroservice()` / `shutdownMicroservice()` from `@chicmoz-pkg/microservice-base`.
- Every subsystem (DB, Kafka, WebSocket server) must implement `MicroserviceBaseSvc` with `init()`, `shutdown()`, and `health()`.

### Security

- **Never commit `.chicmoz.env`** — use `.chicmoz-example.env` as the committed template.
- **Sanitize IP addresses** in RPC node error events before publishing to Kafka (infrastructure topology must not leak).
- Auth service is **mainnet-only** — testnet and devnet bypass the API key gateway.

---

## 7. Specialist Skills

Load these after this foundation skill when working on a specific area:

| Task                                                                      | Load skill             |
| ------------------------------------------------------------------------- | ---------------------- |
| Adding a new Kafka topic or message type                                  | `kafka-message-design` |
| Working with Aztec SDK types (`Fr`, `AztecAddress`, block structures)     | `aztec-types-guide`    |
| Writing/reviewing React components, hooks, data fetching in `explorer-ui` | `react-best-practices` |
| UI layout, styling, design conventions in `explorer-ui`                   | `frontend-design`      |
| Creating a release, writing a changelog, bumping Aztec versions           | `git-release`          |

---

## 8. Where to Find Things

| What you need                                   | Where it lives                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| All domain Zod schemas + TS types               | `packages/types/src/`                                                                           |
| Kafka topic names and message payload types     | `packages/message-registry/src/aztec.ts` (L2), `packages/message-registry/src/ethereum.ts` (L1) |
| Kafka client abstraction                        | `packages/message-bus/src/`                                                                     |
| Service bootstrap / health check                | `packages/microservice-base/src/`                                                               |
| DB connection + migration runner                | `packages/postgres-helper/src/`                                                                 |
| Block hex deserialization                       | `packages/backend-utils/src/parse-block.ts`                                                     |
| Contract artifact/instance verification         | `packages/contract-verification/src/`                                                           |
| Explorer API route definitions + Zod validators | `services/explorer-api/src/http-server/routes/paths_and_validation.ts`                          |
| Explorer API DB schema                          | `services/explorer-api/src/svcs/database/schema/`                                               |
| Aztec L2 polling logic                          | `services/aztec-listener/src/svcs/poller/`                                                      |
| Aztec L2 Kafka publishers                       | `services/aztec-listener/src/events/emitted/`                                                   |
| L1 event watchers                               | `services/ethereum-listener/src/svcs/events-watcher/`                                           |
| WebSocket broadcast logic                       | `services/websocket-event-publisher/src/ws-server/`                                             |
| Frontend API layer (Axios calls)                | `services/explorer-ui/src/api/`                                                                 |
| Frontend React Query hooks                      | `services/explorer-ui/src/hooks/api/`                                                           |
| Frontend WebSocket hook                         | `services/explorer-ui/src/hooks/websocket/`                                                     |
| Frontend route definitions                      | `services/explorer-ui/src/routes/`                                                              |
| Frontend page components                        | `services/explorer-ui/src/pages/`                                                               |
| Frontend shared UI primitives (shadcn/ui)       | `services/explorer-ui/src/components/ui/`                                                       |
| All query key definitions                       | `services/explorer-ui/src/hooks/api/utils.ts`                                                   |
| API + WebSocket URL constants (frontend)        | `services/explorer-ui/src/service/constants.ts`                                                 |
| Production K8s manifests                        | `k8s/production/{service}/{network}/`                                                           |
| Skaffold entry points                           | `k8s/production/skaffold.light.yaml` (mainnet), `skaffold.devnet.yaml`, `skaffold.testnet.yaml` |
| Deploy scripts                                  | `scripts/production/deploy.sh` (mainnet), `deploy-devnet.sh`, `deploy-testnet.sh`               |
| GitHub Actions workflows                        | `.github/workflows/`                                                                            |
| Environment variable template                   | `.chicmoz-example.env`                                                                          |
| Known bugs / issues                             | `bugs.md`                                                                                       |
