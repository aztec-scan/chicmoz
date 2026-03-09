# Contract projects

`src/contract-projects/` contains the Aztec contract projects used by event-cannon. Current projects:

- `SimpleLogging/`
- `SimpleLoggingUpdate/`

## Compile contracts (if changed or updated version)

```sh
aztec-up install 4.1.0-rc.2
aztec-up use 4.1.0-rc.2

cd src/contract-projects/YOUR_PROJECT
aztec compile

aztec codegen target --outdir ../../artifacts
```

## Foundry path note

If `forge` is installed but Aztec cannot find it, ensure the Foundry bin path is exported in your shell before running `aztec compile`:

```sh
export PATH="$HOME/.foundry/bin:$PATH"
```

---

# Running locally against minikube

Run the event-cannon as a local yarn process while connecting to the Aztec node and explorer API running inside the minikube cluster.

## Prerequisites

- minikube running with the nginx ingress addon enabled
- The sandbox services deployed (aztec-sandbox-node, anvil-ethereum-node, explorer-api, auth)
- Ingress hostnames resolving to minikube — either via `minikube tunnel` or `/etc/hosts` entries pointing to the minikube IP

## Build

From the repo root:

```sh
yarn build:packages
```

Then from `services/event-cannon/`:

```sh
yarn build
```

## Environment variables

| Variable                                 | Default                                   | Override for local?            | Description                                    |
| ---------------------------------------- | ----------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `AZTEC_RPC_URL`                          | `http://aztec.sandbox.chicmoz.localhost`  | No                             | Aztec node RPC endpoint                        |
| `ETHEREUM_RPC_URL`                       | `http://eth.sandbox.chicmoz.localhost`    | No                             | Anvil L1 node (for L1-L2 scenarios)            |
| `EXPLORER_API_URL`                       | `http://api.sandbox.chicmoz.localhost/v1` | **Yes** — must include API key | Chicmoz explorer API                           |
| `SCENARIO_DELAY`                         | `1000`                                    | Optional                       | Delay (ms) between scenarios                   |
| `INIFINITE_LOOP`                         | `false`                                   | Optional                       | Run scenarios in an infinite loop              |
| `EXIT_ON_API_ERROR`                      | `false`                                   | Optional                       | Exit process on explorer API errors            |
| `SCENARIO_SIMPLE_DEFAULT_ACCOUNT`        | `false`                                   | Enable as needed               | Deploy a new Schnorr account                   |
| `SCENARIO_TOKEN_CONTRACT`                | `false`                                   | Enable as needed               | Deploy Token contract, mint, transfer          |
| `SCENARIO_FUNCTIONS_VOTE`                | `false`                                   | Enable as needed               | Deploy PrivateVoting, cast votes               |
| `SCENARIO_SIMPLE_CONTRACT`               | `false`                                   | Enable as needed               | Simple contract deploy + artifact registration |
| `SCENARIO_SIMPLE_LOG`                    | `false`                                   | Enable as needed               | Deploy SimpleLogging contract                  |
| `SCENARIO_L1L2_PUBLIC_MESSAGING`         | `false`                                   | Enable as needed               | L1-L2 public bridge flow                       |
| `SCENARIO_L1L2_PRIVATE_MESSAGING`        | `false`                                   | Enable as needed               | L1-L2 private bridge flow                      |
| `SCENARIO_DEPLOY_AND_UPDATE`             | `false`                                   | Enable as needed               | Deploy and update contract                     |
| `SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT` | `false`                                   | Enable as needed               | Deploy and register standard token             |

The `EXPLORER_API_URL` requires the API key in the path because the ingress uses the URL pattern `/v1/<api-key>/<path>`. The auth service validates the key and the ingress rewrites the URL to strip it before forwarding to the backend. Use `dev-api-key` for local development.

## Using a .env file

Create a `.env` file in `services/event-cannon/` (already gitignored via the root `*.env` pattern):

```env
AZTEC_RPC_URL=http://aztec.sandbox.chicmoz.localhost
ETHEREUM_RPC_URL=http://eth.sandbox.chicmoz.localhost
EXPLORER_API_URL=http://api.sandbox.chicmoz.localhost/v1/dev-api-key
INIFINITE_LOOP=false
EXIT_ON_API_ERROR=false
SCENARIO_SIMPLE_DEFAULT_ACCOUNT=true
SCENARIO_TOKEN_CONTRACT=true
SCENARIO_FUNCTIONS_VOTE=true
SCENARIO_SIMPLE_CONTRACT=true
SCENARIO_SIMPLE_LOG=true
SCENARIO_L1L2_PUBLIC_MESSAGING=true
SCENARIO_L1L2_PRIVATE_MESSAGING=true
SCENARIO_DEPLOY_AND_UPDATE=true
SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT=true
```

Then run with:

```sh
env $(cat .env | xargs) yarn dev
```

Or using `dotenv-cli`:

```sh
npx dotenv-cli -e .env -- yarn dev
```

## Alternative: kubectl port-forward

If the ingress hostnames don't resolve (e.g. no `minikube tunnel`), port-forward the services directly:

```sh
kubectl port-forward svc/aztec-sandbox-node -n chicmoz 8081:8081
kubectl port-forward svc/anvil-ethereum-node -n chicmoz 8545:8545
kubectl port-forward svc/explorer-api-sandbox-service -n chicmoz 8080:80
```

Then use these overrides in your `.env`:

```env
AZTEC_RPC_URL=http://localhost:8081
ETHEREUM_RPC_URL=http://localhost:8545
EXPLORER_API_URL=http://localhost:8080
```

This bypasses the ingress auth layer entirely — the explorer API has no authentication middleware of its own.

## Troubleshooting

- **LMDB errors on re-runs**: Delete the `./store/` directory to clear stale PXE state.
- **Explorer API timeouts**: Calls have a 5-second timeout. If the ingress adds latency, you may see timeout errors.
- **L1-L2 messaging**: These scenarios require the Anvil L1 node to be accessible. They use the standard Hardhat/Anvil test mnemonic (`test test test...junk`).
