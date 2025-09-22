# AGENTS.md - Development Guide for AI Coding Agents

## Build Commands

- `yarn build:packages` - Build shared packages (required before building services)
- `yarn build` - Build all packages and services in parallel
- `yarn build-all-slow` - Build everything with proper dependency order
- `cd services/{service} && yarn build` - Build specific service

## Test Commands

- `yarn test` - Run all tests across workspaces
- `cd services/{service} && yarn test` - Run tests for specific service (uses vitest)
- `cd services/{service} && yarn test:watch` - Run tests in watch mode
- `vitest run tests/unit/specific-file.test.ts` - Run single test file
- `yarn test:coverage` - Run with coverage (service level)

## Lint Commands

- `yarn lint` - Lint all code
- `yarn lint:packages` - Lint only shared packages
- `cd services/{service} && yarn lint` - Lint specific service

## Deployment (Kubernetes)

- **Local environments**: `k8s/local/` - Contains Skaffold configs for sandbox, devnet, testnet
- **Production**: `k8s/production/` - Production deployments with proper ingress/certs
- **Networks supported**: sandbox, local_devnet, remote_devnet, testnet
- **Tools**: Uses Skaffold for deployment orchestration, separate configs per service/environment

## Code Style Guidelines

- **No default exports**: Use `import/no-default-export` ESLint rule
- **Named imports**: Always use named imports, never default exports
- **File extensions**: Use `.js` imports in TypeScript files (ES modules)
- **Types**: Prefer `type` over `interface`, strict TypeScript with type checking
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Error handling**: No `console.log` (use structured logging), no param reassignment
- **Formatting**: Prettier with organize-imports plugin, curly braces required
- **Database**: Use Drizzle ORM for type-safe queries, migrations in each service
