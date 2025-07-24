# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build Commands

```bash
# Build all packages and services
yarn build

# Build only shared packages (required before building services)
yarn build:packages

# Build everything with proper dependency order (slower)
yarn build-all-slow
```

### Testing and Linting

```bash
# Run all tests across workspaces
yarn test

# Lint all code
yarn lint

# Lint only shared packages
yarn lint:packages

# Run tests for a specific service
cd services/{service} && yarn test

# Run tests in watch mode
cd services/{service} && yarn test:watch
```

### Local Development Setup

```bash
# Terminal 1: Start local Kubernetes cluster with all services
minikube start --kubernetes-version=v1.25.3 --cpus max --memory max
skaffold run -f k8s/local/skaffold.default.yaml

# Terminal 2: Set up port forwarding (will ask for password)
./scripts/miscellaneous.sh

# Access points:
# - Explorer UI: http://sandbox.chicmoz.localhost
# - API: http://api.sandbox.chicmoz.localhost
# - API Index: http://api.sandbox.chicmoz.localhost/v1/dev-api-key/l2/index
```

### Service-Level Development

```bash
# In any service directory (e.g., services/explorer-api):
yarn dev          # Development mode with hot reload
yarn build        # Production build
yarn start        # Start production server
yarn migrate      # Run database migrations
```

### Alternative Development Workflows

```bash
# Run backend services only (for faster frontend development)
skaffold run -f k8s/local/skaffold.no_ui.yaml

# Then run UI locally:
yarn build:packages
cd services/explorer-ui
yarn && yarn build && yarn dev

# Deploy individual services
skaffold run -f k8s/local/skaffold.only_aztec-listener.yaml
```

## Architecture Overview

Chicmoz is an **event-driven microservices architecture** for exploring the Aztec blockchain, using **Kafka** as the central message bus.

### Core Data Flow

1. **Data Collection**: `aztec-listener` and `ethereum-listener` poll blockchain nodes
2. **Event Transport**: Services publish events to Kafka topics
3. **Data Processing**: `explorer-api` consumes events and stores data in PostgreSQL
4. **Presentation**: `explorer-ui` (React) and `websocket-event-publisher` serve data to users

### Key Services

- **aztec-listener**: Monitors Aztec nodes for blocks, transactions, and chain info
- **ethereum-listener**: Monitors Ethereum L1 contracts related to Aztec rollups
- **explorer-api**: Main REST API server, consumes Kafka events, stores data in PostgreSQL
- **explorer-ui**: React frontend with real-time WebSocket updates
- **websocket-event-publisher**: Forwards Kafka events to WebSocket clients
- **event-cannon**: Testing utility for generating blockchain activity
- **auth**: JWT authentication service with rate limiting

### Technology Stack

- **Backend**: Node.js, TypeScript, Express.js, PostgreSQL, Drizzle ORM, Kafka
- **Frontend**: React 18, TypeScript, Vite, TanStack Query/Router, Tailwind CSS, Radix UI
- **Infrastructure**: Docker, Kubernetes, Skaffold, Grafana

## Shared Packages

The project uses **yarn workspaces** with shared packages in `/packages/@chicmoz-pkg/`:

- **types**: Shared TypeScript definitions and Zod schemas
- **message-registry**: Kafka event schemas and topic definitions
- **message-bus**: Kafka producer/consumer abstractions
- **microservice-base**: Common service lifecycle management
- **postgres-helper**: Database utilities and connection management
- **backend-utils**: Shared backend utility functions

**Important**: Always run `yarn build:packages` before building services, as services depend on these shared packages.

## Code Style Guidelines

- **Imports**: Use named imports, no default exports (`import/no-default-export` rule)
- **Types**: Use TypeScript with strict type checking, prefer `type` over `interface`
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Error Handling**: Use structured error handling with proper logging
- **Formatting**: Prettier with organize-imports plugin, no semicolons preference
- **ESLint Rules**: No console.log (`no-console`), curly braces required, no param reassignment
- **File Extensions**: Use `.js` imports in TypeScript files (ES modules)
- **Database**: Use Drizzle ORM with type-safe queries
- **Testing**: Vitest for unit tests with globals enabled

## Database Patterns

### Schema Management

- Each service with a database has its own `/migrations/` directory
- Uses **Drizzle ORM** for type-safe database access
- Run migrations with `yarn migrate` in service directories
- Database schemas are defined in `src/database/schema.ts` files

### Common Database Controllers Pattern

```typescript
// services/{service}/src/svcs/database/controllers/{entity}/
├── index.ts       # Exports all controller functions
├── get-{entity}.ts
├── store.ts
└── delete.ts
```

## Event-Driven Communication

### Message Publishing Pattern

```typescript
import { publishMessage } from "@chicmoz-pkg/message-bus";
import { L2BlockEvent } from "@chicmoz-pkg/message-registry";

await publishMessage(L2BlockEvent.eventName, blockData);
```

### Message Consumption Pattern

```typescript
import { subscribeTo } from "@chicmoz-pkg/message-bus";
import { L2BlockEvent } from "@chicmoz-pkg/message-registry";

subscribeTo(L2BlockEvent.eventName, async (message) => {
  // Process the event
});
```

## API Development

### API Structure

- Base URL pattern: `/api/v1/{apiKey}/l2/{endpoint}`
- OpenAPI 3.0 specification in `src/svcs/http-server/open-api-spec.ts`
- Request validation in `src/svcs/http-server/routes/paths_and_validation.ts`
- Controllers in `src/svcs/database/controllers/`

### Common API Patterns

- Pagination: `?page=1&limit=10`
- Sorting: `?sort=asc|desc`
- Filtering: Service-specific query parameters
- All endpoints require API key authentication

## Frontend Development

### Component Structure

```
src/components/
├── ui/              # Reusable UI primitives (based on Radix)
├── {feature}/       # Feature-specific components
└── data-table/      # Shared table components
```

### API Integration

- API clients in `src/api/`
- React Query hooks in `src/hooks/api/`
- Real-time updates via WebSocket hooks in `src/hooks/websocket/`

### Routing

- Uses **TanStack Router** with file-based routing in `src/routes/`
- Route tree auto-generated in `src/routeTree.gen.ts`

## Environment Configuration

### Network Configurations

- **SANDBOX**: Local development environment
- **TESTNET**: Aztec testnet environment
- **Production**: Live production environment

### Key Environment Variables

- `L2_NETWORK_ID`: Network identifier (required for all services)
- `AZTEC_RPC_URL`: Aztec node endpoint
- `ETHEREUM_HTTP_RPC_URL` / `ETHEREUM_WS_RPC_URL`: Ethereum node endpoints
- API keys, database URLs, Kafka endpoints per service

## Kubernetes Deployment

### Development

- Uses **Skaffold** for deployment orchestration
- Multiple configuration files for different scenarios in `k8s/local/`
- Services are automatically built and deployed on code changes

### Production

- Environment-specific configurations in `k8s/production/`
- TLS certificates managed with cert-manager
- Ingress routing configured per environment

## Debugging and Monitoring

### Local Development

- Kafka UI available at `http://kafka-ui.chicmoz.localhost` (with monitoring setup)
- Grafana dashboards in `k8s/local/grafana/dashboards/`
- Service logs via `kubectl logs`

### Health Checks

- Each service provides health endpoints
- System health available at explorer-api `/health` endpoint
- Database connection status tracked in `aztec-chain-connection` table

## Git

### PR Structure

- the title of a PR has the following structure `<prefix>: <description of the content>`
  `<prefix>` = either "bug", "hotfix", "feat", "ux"
- do not write `generated with claude` in the descriptions.
- for the PR descriptions please use a concise description and make it short. Just the key points.
