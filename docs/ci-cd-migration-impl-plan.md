# CI/CD Migration — Implementation Plan for Remaining Services

This document is a self-contained implementation plan for migrating all remaining Chicmoz services
to the new GitHub Actions + Kustomize CI/CD pattern. It is written to be picked up and executed
by a fresh LLM session with no prior context.

---

## Background

`explorer-ui-v2` is the reference implementation of the new pattern. Study these files first:

- `.github/workflows/explorer-ui-v2.yml` — the workflow template
- `services/explorer-ui-v2/k8s/` — the Kustomize base/overlays template

The old Skaffold-based workflows are:

- `.github/workflows/aztecscan-prod.yml` (mainnet)
- `.github/workflows/aztecscan-prod-testnet.yml` (testnet)
- `.github/workflows/aztecscan-prod-devnet.yml` (devnet)

**Do NOT delete the old Skaffold workflows.** They run in parallel as a safety net until the new
per-service workflows are confirmed working in production.

---

## Image Naming Convention

| Component     | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Registry      | `registry.digitalocean.com/aztlan-containers`         |
| Image name    | `<service>-{network}` (e.g. `explorer-api-mainnet`)   |
| Mutable tag   | `latest`                                              |
| Immutable tag | `{git-sha}` (short SHA from `docker/metadata-action`) |

The network is encoded in the **image name**, not the tag. Tags are simply `latest` and `{sha}`.

Each network gets its own image so mainnet/testnet/devnet can run different Aztec versions
independently.

---

## Workflow Structure

### Frontend services (`explorer-ui`) — 3 jobs

```
set-up → build → deploy
```

`explorer-ui` uses `ARG BASE` (old-pattern Dockerfile that depends on `chicmoz-base`),
so it actually needs the same 4-job structure as backend services. See service spec below.

### Backend services (all others) — 4 jobs

```
set-up → build-base → build → deploy
```

- `build-base` builds + pushes `registry.digitalocean.com/aztlan-containers/chicmoz-base`
  from the root `Dockerfile` using GHA layer cache (`scope=chicmoz-base`)
- `build` receives the base image SHA as `--build-arg BASE=...` and builds the service image
  using GHA layer cache (`scope=<service>-{network}`)

### Network detection (set-up job — all workflows)

```yaml
- name: Determine network
  id: network
  run: |
    if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
      echo "network=${{ inputs.network }}" >> $GITHUB_OUTPUT
    elif [ "${{ github.ref_name }}" = "production" ]; then
      echo "network=mainnet" >> $GITHUB_OUTPUT
    elif [ "${{ github.ref_name }}" = "production-testnet" ]; then
      echo "network=testnet" >> $GITHUB_OUTPUT
    elif [ "${{ github.ref_name }}" = "production-devnet" ]; then
      echo "network=devnet" >> $GITHUB_OUTPUT
    else
      echo "ERROR: Cannot determine network from branch ${{ github.ref_name }}" >&2
      exit 1
    fi
```

`network` is a job output (`needs.set-up.outputs.network`) used throughout all downstream jobs.

### build-base job template

```yaml
build-base:
  runs-on: ubuntu-latest
  needs: set-up
  steps:
    - uses: actions/checkout@v4
    - uses: docker/setup-buildx-action@v3
    - uses: digitalocean/action-doctl@v2
      with:
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
    - run: doctl registry login --expiry-seconds 1200
    - name: Build and push chicmoz-base
      uses: docker/build-push-action@v5
      with:
        context: .
        file: Dockerfile
        push: true
        tags: registry.digitalocean.com/aztlan-containers/chicmoz-base:latest
        cache-from: type=gha,scope=chicmoz-base
        cache-to: type=gha,scope=chicmoz-base,mode=max
```

### build job — passing base image to service

```yaml
build:
  runs-on: ubuntu-latest
  needs: [set-up, build-base]
  env:
    NETWORK: ${{ needs.set-up.outputs.network }}
  steps:
    # ... checkout, buildx, doctl login ...
    - name: Build and push service image
      uses: docker/build-push-action@v5
      with:
        context: .
        file: services/<service>/Dockerfile
        push: true
        tags: |
          registry.digitalocean.com/aztlan-containers/<service>-${{ env.NETWORK }}:latest
          registry.digitalocean.com/aztlan-containers/<service>-${{ env.NETWORK }}:${{ github.sha }}
        build-args: |
          BASE=registry.digitalocean.com/aztlan-containers/chicmoz-base:latest
        cache-from: type=gha,scope=<service>-${{ env.NETWORK }}
        cache-to: type=gha,scope=<service>-${{ env.NETWORK }},mode=max
```

### deploy job template

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [set-up, build]
  env:
    NETWORK: ${{ needs.set-up.outputs.network }}
  steps:
    - uses: actions/checkout@v4
    - name: Restore cached tools
      uses: actions/cache@v4
      with:
        path: tools
        key: ${{ needs.set-up.outputs.tools-cache-key }}
        fail-on-cache-miss: true
    - run: chmod +x tools/* && echo "$PWD/tools" >> $GITHUB_PATH
    - uses: digitalocean/action-doctl@v2
      with:
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
    - run: doctl kubernetes cluster kubeconfig save ${{ env.CLUSTER_NAME }}
    - run: doctl registries kubernetes-manifest aztlan-containers --namespace chicmoz-prod | kubectl apply -f -
    # (optional) inject secrets — see per-service spec
    - run: kubectl apply -k services/<service>/k8s/overlays/${{ env.NETWORK }}/
    - run: kubectl rollout restart deployment/<service>-${{ env.NETWORK }} -n chicmoz-prod
    - run: kubectl rollout status deployment/<service>-${{ env.NETWORK }} -n chicmoz-prod --timeout=300s
```

**Exception:** `auth` — no network suffix. Rollout targets `deployment/auth`. See auth spec.

---

## Kustomize Convention

### Base `deployment.yaml` rules

- No `namespace:` field (set by overlay)
- `metadata.name`: `<service>` (no network suffix)
- `spec.selector.matchLabels.app` and `spec.template.metadata.labels.app`: `<service>` (no suffix)
- `containers[0].name`: `<service>`
- Image: `registry.digitalocean.com/aztlan-containers/<service>` (no network suffix, no tag)
- `imagePullPolicy: Always`
- `imagePullSecrets: [{name: registry-aztlan-containers}]`
- Env vars that are identical across all networks go in the base
- `INSTANCE_NAME`, `L2_NETWORK_ID`, and any `secretKeyRef` env vars go in overlay patches

### Overlay `kustomization.yaml` structure

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: chicmoz-prod
nameSuffix: -mainnet # or -testnet / -devnet

resources:
  - ../../base
  - httproute.yaml # if applicable
  - postgres-config.yaml # if applicable

images:
  - name: registry.digitalocean.com/aztlan-containers/<service>
    newName: registry.digitalocean.com/aztlan-containers/<service>-mainnet
    newTag: latest

patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: <service>
      spec:
        template:
          spec:
            containers:
              - name: <service>
                env:
                  - name: INSTANCE_NAME
                    value: "mainnet_<service>"
                  - name: L2_NETWORK_ID
                    value: "MAINNET"
```

### ConfigMap name transformation (important)

Kustomize's `nameSuffix` DOES transform `envFrom.configMapRef.name` when the ConfigMap is a
resource in the same kustomization. So `postgres-config-explorer-api` in the base becomes
`postgres-config-explorer-api-mainnet` in the mainnet overlay — this is correct behaviour and
requires no extra patches.

### secretKeyRef — must be overlay patches

`secretKeyRef.name` (e.g. `mainnet-config`) and `secretKeyRef.key` differ per network.
They cannot go in the base. Use strategic merge patches in each overlay (see per-service specs).

### backendRefs.name — must be hardcoded

Kustomize `nameSuffix` only transforms `metadata.name`. It does NOT transform:

- `backendRefs.name` in HTTPRoutes
- `targetRefs.name` in SecurityPolicies
- `extensionRef.name` in HTTPRoute filters

These must be hardcoded to the full suffixed name (e.g. `explorer-api-mainnet-service`).

---

## Implementation Order

Implement services in this order (simplest first):

1. `websocket-event-publisher` — no secrets, no DB, has httproute, good warm-up
2. `explorer-api` — most complex; do this early so edge cases are resolved
3. `aztec-listener` — secrets, testnet-specific env patches
4. `ethereum-listener` — secrets with different keys per network
5. `explorer-ui` — frontend build args, needs chicmoz-base
6. `auth` — mainnet only, no nameSuffix edge case
7. `compiler-orchestrator` — RBAC complexity
8. Update `docs/ci-cd-migration.md` status table

---

## Service 1: `websocket-event-publisher`

### Workflow: `.github/workflows/websocket-event-publisher.yml`

```yaml
name: CI/CD Websocket Event Publisher

on:
  push:
    branches: [production-testnet, production, production-devnet]
    paths: ["services/websocket-event-publisher/**"]
  workflow_dispatch:
    inputs:
      network:
        description: "Network to deploy to"
        required: true
        type: choice
        options: [testnet, mainnet, devnet]

env:
  REGISTRY: registry.digitalocean.com/aztlan-containers
  CLUSTER_NAME: aztecscan-prod
```

Jobs: `set-up` → `build-base` → `build` → `deploy`
No secrets. No build args beyond `BASE`.

### Kustomize files

**`services/websocket-event-publisher/k8s/base/deployment.yaml`**
Source: `k8s/production/websocket-event-publisher/mainnet/deployment.yaml`

- Remove `namespace`, `status: {}`
- `metadata.name: websocket-event-publisher`
- `labels.app: websocket-event-publisher`
- Image: `registry.digitalocean.com/aztlan-containers/websocket-event-publisher`
- Add `imagePullPolicy: Always`
- Keep: `resources`, both ports (`websocket-port: 3000`, `health-port: 3001`), liveness/readiness probes
- Base env: `PORT: "3000"`, `NODE_ENV: production`
- Remove from base: `INSTANCE_NAME`, `L2_NETWORK_ID`

**`services/websocket-event-publisher/k8s/base/service.yaml`**
Source: `k8s/production/websocket-event-publisher/mainnet/service.yaml`

- Remove `namespace`
- `metadata.name: websocket-event-publisher`
- `selector.app: websocket-event-publisher`

**`services/websocket-event-publisher/k8s/base/kustomization.yaml`**

```yaml
resources:
  - deployment.yaml
  - service.yaml
```

**`services/websocket-event-publisher/k8s/overlays/mainnet/kustomization.yaml`**

```yaml
namespace: chicmoz-prod
nameSuffix: -mainnet
resources:
  - ../../base
  - httproute.yaml
images:
  - name: registry.digitalocean.com/aztlan-containers/websocket-event-publisher
    newName: registry.digitalocean.com/aztlan-containers/websocket-event-publisher-mainnet
    newTag: latest
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: websocket-event-publisher
      spec:
        template:
          spec:
            containers:
              - name: websocket-event-publisher
                env:
                  - name: INSTANCE_NAME
                    value: "mainnet_websocket-event-publisher"
                  - name: L2_NETWORK_ID
                    value: "MAINNET"
```

**`services/websocket-event-publisher/k8s/overlays/mainnet/httproute.yaml`**
Source: `k8s/production/websocket-event-publisher/mainnet/httproute.yaml`

- Keep all 8 parentRefs and both hostnames (`ws.aztecscan.xyz`, `ws.mainnet.aztecscan.xyz`)
- `backendRefs.name: websocket-event-publisher-mainnet` (hardcoded — nameSuffix doesn't transform this)
- `metadata.name: websocket-event-publisher` (nameSuffix appends -mainnet automatically)

**Testnet overlay:** same pattern. `nameSuffix: -testnet`, `newName: ...-testnet`, `INSTANCE_NAME: testnet_websocket-event-publisher`, `L2_NETWORK_ID: TESTNET`
Source httproute: `k8s/production/websocket-event-publisher/testnet/httproute.yaml`

**Devnet overlay:** same pattern. Additionally include `backendtrafficpolicy.yaml`:

- Source: `k8s/production/websocket-event-publisher/devnet/backendtrafficpolicy.yaml`
- Add to `resources:` in the devnet kustomization.yaml

---

## Service 2: `explorer-api`

### Workflow: `.github/workflows/explorer-api.yml`

Jobs: `set-up` → `build-base` → `build` → `deploy`
No build args beyond `BASE`. No secrets needed in deploy (the shared `{network}-config` secret
is created by the still-running old Skaffold workflows during transition).
Add a comment in the deploy job: `# NOTE: {network}-config secret is created by the old aztecscan-prod*.yml workflow during transition period`

### Kustomize files

**`services/explorer-api/k8s/base/deployment.yaml`**
Source: `k8s/production/explorer-api/mainnet/deployment.yaml`

- Remove `namespace`, `status: {}`
- `metadata.name: explorer-api`
- `labels.app: explorer-api-label` → use `explorer-api`
- Image: `registry.digitalocean.com/aztlan-containers/explorer-api`
- Add `imagePullPolicy: Always`
- Keep: init container (migrations with `yarn run migrate`), `envFrom` both configMapRefs
  - Use names WITHOUT network suffix: `postgres-config-global` (stays as-is), `postgres-config-explorer-api`
  - Kustomize will append nameSuffix to `postgres-config-explorer-api` → `postgres-config-explorer-api-mainnet` ✓
- Keep: `readinessProbe`, `resources`, ports
- Base env: `NODE_ENV: production`, `PUBLIC_API_KEY: temporary-api-key`
- Remove from base: `INSTANCE_NAME`, `L2_NETWORK_ID`

**`services/explorer-api/k8s/base/service.yaml`**

- `metadata.name: explorer-api`
- `selector.app: explorer-api`

**`services/explorer-api/k8s/base/kustomization.yaml`**

```yaml
resources:
  - deployment.yaml
  - service.yaml
```

**`services/explorer-api/k8s/overlays/mainnet/postgres-config.yaml`**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config-explorer-api # nameSuffix appends -mainnet → postgres-config-explorer-api-mainnet
  namespace: chicmoz-prod
data:
  POSTGRES_DB_NAME: "explorer_api_mainnet"
```

**`services/explorer-api/k8s/overlays/mainnet/http-filter.yaml`**
Source: `k8s/production/explorer-api/mainnet/http-filter.yaml`

- `metadata.name: explorer-api-rewrite` (nameSuffix → `explorer-api-rewrite-mainnet`)

**`services/explorer-api/k8s/overlays/mainnet/httproute.yaml`**
Source: `k8s/production/explorer-api/mainnet/httproute.yaml`

- Keep all 8 parentRefs and both hostnames
- `backendRefs.name: explorer-api-mainnet-service` (hardcoded)
- `filters.extensionRef.name: explorer-api-rewrite-mainnet` (hardcoded — the suffixed filter name)
- `metadata.name: explorer-api` (nameSuffix appends automatically)

**`services/explorer-api/k8s/overlays/mainnet/securitypolicy.yaml`**
Source: `k8s/production/explorer-api/mainnet/securitypolicy.yaml`

- `targetRefs.name: explorer-api-mainnet` (hardcoded)
- Keep all CORS origins and extAuth config exactly
- `extAuth.http.backendRefs[0].name: auth-service` (hardcoded — auth service name is stable, no suffix)

**`services/explorer-api/k8s/overlays/mainnet/kustomization.yaml`**

```yaml
namespace: chicmoz-prod
nameSuffix: -mainnet
resources:
  - ../../base
  - httproute.yaml
  - postgres-config.yaml
  - http-filter.yaml
  - securitypolicy.yaml
images:
  - name: registry.digitalocean.com/aztlan-containers/explorer-api
    newName: registry.digitalocean.com/aztlan-containers/explorer-api-mainnet
    newTag: latest
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: explorer-api
      spec:
        template:
          spec:
            containers:
              - name: explorer-api
                env:
                  - name: INSTANCE_NAME
                    value: "mainnet_explorer-api"
                  - name: L2_NETWORK_ID
                    value: "MAINNET"
            initContainers:
              - name: run-migrations
                env:
                  - name: INSTANCE_NAME
                    value: "mainnet_explorer-api"
```

**Testnet overlay:** same structure, no `securitypolicy.yaml`. DB name: `explorer_api_testnet`.

**Devnet overlay:** same as testnet, but add an extra patch for `REDIS_HOST`:

```yaml
- name: REDIS_HOST
  value: "redis-cache"
```

(This env var exists in the devnet deployment but not mainnet/testnet.)
DB name: `explorer_api_devnet`.

---

## Service 3: `aztec-listener`

### Workflow: `.github/workflows/aztec-listener.yml`

Jobs: `set-up` → `build-base` → `build` → `deploy`

**Secret injection in deploy job:**

```yaml
- name: Inject Aztec RPC secret
  env:
    AZTEC_RPC_NODES_MAINNET: ${{ vars.AZTEC_RPC_NODES_MAINNET }}
    AZTEC_RPC_NODES_TESTNET: ${{ vars.AZTEC_RPC_NODES_TESTNET }}
    AZTEC_RPC_NODES_DEVNET: ${{ vars.AZTEC_RPC_NODES_DEVNET }}
  run: |
    NETWORK="${{ needs.set-up.outputs.network }}"
    case "$NETWORK" in
      mainnet)
        kubectl create secret generic mainnet-config \
          --from-literal=AZTEC_RPC_NODES_MAINNET=$AZTEC_RPC_NODES_MAINNET \
          --namespace chicmoz-prod --dry-run=client -o yaml | kubectl apply -f -
        ;;
      testnet)
        kubectl create secret generic testnet-config \
          --from-literal=AZTEC_RPC_NODES_TESTNET=$AZTEC_RPC_NODES_TESTNET \
          --namespace chicmoz-prod --dry-run=client -o yaml | kubectl apply -f -
        ;;
      devnet)
        kubectl create secret generic devnet-config \
          --from-literal=AZTEC_RPC_NODES_DEVNET=$AZTEC_RPC_NODES_DEVNET \
          --namespace chicmoz-prod --dry-run=client -o yaml | kubectl apply -f -
        ;;
    esac
```

### Kustomize files

**`services/aztec-listener/k8s/base/deployment.yaml`**
Source: `k8s/production/aztec-listener/mainnet/deployment.yaml`

- No service file (aztec-listener has no HTTP exposure)
- Remove `namespace`, `status: {}`
- `metadata.name: aztec-listener`
- Image: `registry.digitalocean.com/aztlan-containers/aztec-listener`
- Add `imagePullPolicy: Always`
- Keep: init container (migrations), `envFrom` both configMapRefs
  - `postgres-config-global` (unchanged)
  - `postgres-config-aztec-listener` (nameSuffix will append network suffix ✓)
- Keep: `resources`
- Base env: `NODE_ENV: production`, `AZTEC_LISTEN_FOR_BLOCKS: "true"`, `AZTEC_LISTEN_FOR_PENDING_TXS: "true"`
- Remove from base: `INSTANCE_NAME`, `L2_NETWORK_ID`, `AZTEC_RPC_URLS` (secretKeyRef — overlay patch)

**`services/aztec-listener/k8s/base/kustomization.yaml`**

```yaml
resources:
  - deployment.yaml
```

**Per overlay `postgres-config.yaml`:**

```yaml
# mainnet: POSTGRES_DB_NAME: "aztec_listener_mainnet"
# testnet: POSTGRES_DB_NAME: "aztec_listener_testnet"
# devnet:  POSTGRES_DB_NAME: "aztec_listener_devnet"
metadata:
  name: postgres-config-aztec-listener # nameSuffix appends network
```

**Per overlay patches (mainnet example):**

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: aztec-listener
      spec:
        template:
          spec:
            containers:
              - name: aztec-listener
                env:
                  - name: INSTANCE_NAME
                    value: "mainnet_aztec-listener"
                  - name: L2_NETWORK_ID
                    value: "MAINNET"
                  - name: AZTEC_RPC_URLS
                    valueFrom:
                      secretKeyRef:
                        name: mainnet-config
                        key: AZTEC_RPC_NODES_MAINNET
```

**Testnet overlay adds extra env vars** (present in testnet deployment but not mainnet):

```yaml
- name: NODE_OPTIONS
  value: "--max-old-space-size=1536"
```

---

## Service 4: `ethereum-listener`

### Workflow: `.github/workflows/ethereum-listener.yml`

Jobs: `set-up` → `build-base` → `build` → `deploy`

**Secret injection in deploy job (all 3 secrets per network):**

```yaml
- name: Inject L1 RPC secrets
  env:
    MAINNET_AZTEC_L1_HTTP: ${{ vars.MAINNET_AZTEC_L1_HTTP }}
    MAINNET_AZTEC_L1_WS: ${{ vars.MAINNET_AZTEC_L1_WS }}
    ETHEREUM_HTTP_ALCHEMY_MAINNET_URL: ${{ vars.ETHEREUM_HTTP_ALCHEMY_MAINNET_URL }}
    TESTNET_AZTEC_L1_HTTP: ${{ vars.TESTNET_AZTEC_L1_HTTP }}
    TESTNET_AZTEC_L1_WS: ${{ vars.TESTNET_AZTEC_L1_WS }}
    DEVNET_AZTEC_L1_HTTP: ${{ vars.DEVNET_AZTEC_L1_HTTP }}
    DEVNET_AZTEC_L1_WS: ${{ vars.DEVNET_AZTEC_L1_WS }}
    ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL: ${{ vars.ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL }}
  run: |
    NETWORK="${{ needs.set-up.outputs.network }}"
    case "$NETWORK" in
      mainnet)
        kubectl create secret generic mainnet-config \
          --from-literal=MAINNET_AZTEC_L1_HTTP=$MAINNET_AZTEC_L1_HTTP \
          --from-literal=MAINNET_AZTEC_L1_WS=$MAINNET_AZTEC_L1_WS \
          --from-literal=ETHEREUM_HTTP_ALCHEMY_MAINNET_URL=$ETHEREUM_HTTP_ALCHEMY_MAINNET_URL \
          --namespace chicmoz-prod --dry-run=client -o yaml | kubectl apply -f -
        ;;
      testnet)
        kubectl create secret generic testnet-config \
          --from-literal=TESTNET_AZTEC_L1_HTTP=$TESTNET_AZTEC_L1_HTTP \
          --from-literal=TESTNET_AZTEC_L1_WS=$TESTNET_AZTEC_L1_WS \
          --from-literal=ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL=$ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL \
          --namespace chicmoz-prod --dry-run=client -o yaml | kubectl apply -f -
        ;;
      devnet)
        kubectl create secret generic devnet-config \
          --from-literal=DEVNET_AZTEC_L1_HTTP=$DEVNET_AZTEC_L1_HTTP \
          --from-literal=DEVNET_AZTEC_L1_WS=$DEVNET_AZTEC_L1_WS \
          --from-literal=ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL=$ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL \
          --namespace chicmoz-prod --dry-run=client -o yaml | kubectl apply -f -
        ;;
    esac
```

### Kustomize files

**`services/ethereum-listener/k8s/base/deployment.yaml`**
Source: `k8s/production/ethereum-listener/mainnet/deployment.yaml`

- No service file
- Remove `namespace`, `status: {}`
- `metadata.name: ethereum-listener`
- Image: `registry.digitalocean.com/aztlan-containers/ethereum-listener`
- Add `imagePullPolicy: Always`
- Keep: init container, `envFrom` both configMapRefs (`postgres-config-global`, `postgres-config-ethereum-listener`)
- Keep: `resources`
- Base env: `NODE_ENV: production`, `LISTENER_DISABLED: "false"`, `LISTEN_FOR_BLOCKS: "true"`
- Remove from base: `INSTANCE_NAME`, `L2_NETWORK_ID`, all 3 `secretKeyRef` env vars

**Per overlay patches (mainnet example):**

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: ethereum-listener
      spec:
        template:
          spec:
            containers:
              - name: ethereum-listener
                env:
                  - name: INSTANCE_NAME
                    value: "ethereum-listener-mainnet"
                  - name: L2_NETWORK_ID
                    value: "MAINNET"
                  - name: ETHEREUM_HTTP_RPC_URL
                    valueFrom:
                      secretKeyRef:
                        name: mainnet-config
                        key: MAINNET_AZTEC_L1_HTTP
                  - name: ETHEREUM_WS_RPC_URL
                    valueFrom:
                      secretKeyRef:
                        name: mainnet-config
                        key: MAINNET_AZTEC_L1_WS
                  - name: ETHEREUM_ALCHEMY_HTTP_URL
                    valueFrom:
                      secretKeyRef:
                        name: mainnet-config
                        key: ETHEREUM_HTTP_ALCHEMY_MAINNET_URL
```

Testnet/devnet: substitute `testnet-config`/`devnet-config` and the corresponding key names.
Note: testnet and devnet both use `ETHEREUM_HTTP_ALCHEMY_SEPOLIA_URL` (same Sepolia key).

**`postgres-config.yaml` DB names:**

- mainnet: `ethereum_listener_mainnet`
- testnet: `ethereum_listener_testnet`
- devnet: `ethereum_listener_devnet`

---

## Service 5: `explorer-ui`

### Workflow: `.github/workflows/explorer-ui.yml`

Jobs: `set-up` → `build-base` → `build` → `deploy`

`explorer-ui` uses `ARG BASE` in its Dockerfile (unlike `explorer-ui-v2`), so it needs the
`build-base` job identical to backend services.

**Resolve network-specific build args in build job:**

```yaml
- name: Resolve network-specific build args
  id: build-args
  run: |
    case "${{ needs.set-up.outputs.network }}" in
      mainnet)
        echo "l2_network_id=MAINNET" >> $GITHUB_OUTPUT
        echo "api_url=https://api.aztecscan.xyz/v1" >> $GITHUB_OUTPUT
        echo "ws_url=wss://ws.aztecscan.xyz" >> $GITHUB_OUTPUT
        ;;
      testnet)
        echo "l2_network_id=TESTNET" >> $GITHUB_OUTPUT
        echo "api_url=https://api.testnet.aztecscan.xyz/v1" >> $GITHUB_OUTPUT
        echo "ws_url=wss://ws.testnet.aztecscan.xyz" >> $GITHUB_OUTPUT
        ;;
      devnet)
        echo "l2_network_id=DEVNET" >> $GITHUB_OUTPUT
        echo "api_url=https://api.devnet.aztecscan.xyz/v1" >> $GITHUB_OUTPUT
        echo "ws_url=wss://ws.devnet.aztecscan.xyz" >> $GITHUB_OUTPUT
        ;;
    esac
```

**`IMAGE_NAME`** for `explorer-ui` is `explorer-ui-{network}` (different image per network because
VITE vars are baked in at build time). Construct in build job:

```yaml
IMAGE_NAME: explorer-ui-${{ needs.set-up.outputs.network }}
```

**Docker build-args in build job:**

```
BASE=registry.digitalocean.com/aztlan-containers/chicmoz-base:latest
NODE_ENV=production
VITE_L2_NETWORK_ID=${{ steps.build-args.outputs.l2_network_id }}
VITE_CHICMOZ_ALL_UI_URLS=Mainnet|https://aztecscan.xyz,Testnet|https://testnet.aztecscan.xyz,Devnet|https://devnet.aztecscan.xyz
VITE_API_URL=${{ steps.build-args.outputs.api_url }}
VITE_API_KEY=temporary-api-key
VITE_WS_URL=${{ steps.build-args.outputs.ws_url }}
VITE_DISCORD_URL=https://discord.gg/xnw7fVXB7m
VITE_GITHUB_URL=https://github.com/aztec-scan/chicmoz
VITE_X_URL=https://x.com/aztecscan
VITE_VERSION_STRING=${{ github.sha }}
```

### Kustomize files

**`services/explorer-ui/k8s/base/deployment.yaml`**
Source: `k8s/production/explorer-ui/mainnet/deployment.yaml`

- Remove `namespace`
- `metadata.name: explorer-ui`
- `labels.app: explorer-ui`
- Image: `registry.digitalocean.com/aztlan-containers/explorer-ui`
- Add `imagePullPolicy: Always`
- Keep: `resources`, ports (`http-app-port: 80`)
- No env vars in base (nginx static server — no runtime config)

**`services/explorer-ui/k8s/base/service.yaml`**

- `metadata.name: explorer-ui`, `selector.app: explorer-ui`

**`services/explorer-ui/k8s/base/kustomization.yaml`**

```yaml
resources:
  - deployment.yaml
  - service.yaml
```

**Mainnet overlay:**

```yaml
namespace: chicmoz-prod
nameSuffix: -mainnet
resources:
  - ../../base
  - httproute.yaml
images:
  - name: registry.digitalocean.com/aztlan-containers/explorer-ui
    newName: registry.digitalocean.com/aztlan-containers/explorer-ui-mainnet
    newTag: latest
```

No patches needed (no runtime env vars — nginx static server).

**Mainnet httproute:** copy from `k8s/production/explorer-ui/mainnet/httproute.yaml` exactly.

- `backendRefs.name: explorer-ui-mainnet-service` (hardcoded)
- All 8 parentRefs kept. Both hostnames kept (`aztecscan.xyz`, `mainnet.aztecscan.xyz`).

**Testnet httproute:** copy from `k8s/production/explorer-ui/testnet/httproute.yaml`.

- `backendRefs.name: explorer-ui-testnet-service` (hardcoded)

**Devnet httproute:** does NOT exist in old manifests — create it:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: explorer-ui
  namespace: chicmoz-prod
  labels:
    app.kubernetes.io/name: explorer-ui
    app.kubernetes.io/part-of: chicmoz-prod
spec:
  parentRefs:
    - name: aztecscan-gateway
      sectionName: ui-devnet-http
    - name: aztecscan-gateway
      sectionName: ui-devnet-https
  hostnames:
    - devnet.aztecscan.xyz
  rules:
    - backendRefs:
        - name: explorer-ui-devnet-service # hardcoded
          port: 80
      matches:
        - path:
            type: PathPrefix
            value: /
```

**Deploy rollout:** `deployment/explorer-ui-{network}` (standard pattern).

---

## Service 6: `auth`

### Workflow: `.github/workflows/auth.yml`

**Mainnet only** — no network detection needed.

```yaml
on:
  push:
    branches: [production]
    paths: ["services/auth/**"]
  workflow_dispatch: # no network input — always mainnet
```

Jobs: `set-up` (simplified — no network detection step) → `build-base` → `build` → `deploy`

`IMAGE_NAME: auth-mainnet` (hardcoded, no `{network}` variable)

No secrets in deploy.

**Deploy rollout:** `deployment/auth` — NO network suffix (see critical note below).

### Critical: No `nameSuffix` for auth

Auth's service must remain named exactly `auth-service` because
`k8s/production/explorer-api/mainnet/securitypolicy.yaml` (and the new Kustomize version)
hardcodes `extAuth.http.backendRefs[0].name: auth-service`. Adding a `-mainnet` suffix to auth
would break the mainnet extAuth integration.

### Kustomize files

**`services/auth/k8s/base/deployment.yaml`**
Source: `k8s/production/auth/deployment.yaml`

- Remove `namespace`, `status: {}`
- `metadata.name: auth`
- Image: `registry.digitalocean.com/aztlan-containers/auth`
- Add `imagePullPolicy: Always`
- Keep ALL env vars (all hardcoded — no network-specific values, no secrets):
  `PORT: "80"`, `POSTGRES_DB_NAME: "auth"`, `REDIS_HOST: redis-cache`,
  `REDIS_PORT: "6379"`, `NODE_ENV: production`
- Keep: `envFrom: postgres-config-global`, `readinessProbe`, `resources`, ports

**`services/auth/k8s/base/service.yaml`**

- `metadata.name: auth` — Kustomize will NOT add a suffix (no nameSuffix in overlay)
- Resulting service name stays `auth-service` after overlay processing...
  Wait — with no `nameSuffix`, `metadata.name: auth` stays `auth`, and the service
  `metadata.name: auth` produces a service named `auth`. But the old service is `auth-service`.

  **Resolution:** Set `metadata.name: auth-service` directly in base service.yaml (hardcoded).
  This avoids any naming confusion and keeps the service name stable.

**`services/auth/k8s/base/kustomization.yaml`**

```yaml
resources:
  - deployment.yaml
  - service.yaml
```

**`services/auth/k8s/overlays/mainnet/postgres-config.yaml`**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config-auth
  namespace: chicmoz-prod
data:
  POSTGRES_DB_NAME: "auth"
```

**`services/auth/k8s/overlays/mainnet/kustomization.yaml`**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: chicmoz-prod
# NO nameSuffix — auth-service name must remain stable for securitypolicy extAuth reference

resources:
  - ../../base
  - postgres-config.yaml

images:
  - name: registry.digitalocean.com/aztlan-containers/auth
    newName: registry.digitalocean.com/aztlan-containers/auth-mainnet
    newTag: latest
```

---

## Service 7: `compiler-orchestrator`

### Workflow: `.github/workflows/compiler-orchestrator.yml`

Jobs: `set-up` → `build-base` → `build` → `deploy`
No secrets. `workflow_dispatch` with network dropdown.

### Kustomize files

**RBAC handling:** The `ServiceAccount`, `Role`, and `RoleBinding` are network-agnostic in terms
of structure but their names will get the `nameSuffix` appended when in base. The
`serviceAccountName` in the deployment also gets transformed by Kustomize — this is fine.
Include `rbac.yaml` in the **base** so it's shared.

**`services/compiler-orchestrator/k8s/base/rbac.yaml`**
Copy from `k8s/production/compiler-orchestrator/mainnet/rbac.yaml` exactly but:

- `metadata.name: compiler-orchestrator` (on ServiceAccount, Role, RoleBinding)
- Kustomize nameSuffix will transform all three to e.g. `compiler-orchestrator-mainnet`
- `spec.template.spec.serviceAccountName: compiler-orchestrator` in deployment —
  Kustomize DOES transform `serviceAccountName` when it matches a ServiceAccount in the same
  kustomization — this works correctly.

**`services/compiler-orchestrator/k8s/base/deployment.yaml`**
Source: `k8s/production/compiler-orchestrator/mainnet/deployment.yaml`

- Remove `namespace`, `status: {}`
- `metadata.name: compiler-orchestrator`
- Image: `registry.digitalocean.com/aztlan-containers/compiler-orchestrator`
- Add `imagePullPolicy: Always`
- `serviceAccountName: compiler-orchestrator`
- Keep: `resources`, liveness/readiness probes
- Base env (identical across networks):
  `NODE_ENV: production`, `K8S_NAMESPACE: chicmoz-prod`,
  `MAX_CONCURRENT_JOBS: "3"`, `JOB_TIMEOUT_SECONDS: "300"`,
  `IMAGE_PULL_SECRET: registry-aztlan-containers`
- Remove from base: `INSTANCE_NAME`, `L2_NETWORK_ID`, `COMPILER_IMAGE` (overlay patches)

**`services/compiler-orchestrator/k8s/base/kustomization.yaml`**

```yaml
resources:
  - deployment.yaml
  - rbac.yaml
```

**Per overlay patches (mainnet example):**

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: compiler-orchestrator
      spec:
        template:
          spec:
            containers:
              - name: compiler-orchestrator
                env:
                  - name: INSTANCE_NAME
                    value: "mainnet_compiler-orchestrator"
                  - name: L2_NETWORK_ID
                    value: "MAINNET"
                  - name: COMPILER_IMAGE
                    value: "registry.digitalocean.com/aztlan-containers/contract-compiler-mainnet:5.0.0-rc.1"
```

**Current `COMPILER_IMAGE` values (hardcoded — update manually when Aztec version changes):**

- mainnet: `registry.digitalocean.com/aztlan-containers/contract-compiler-mainnet:5.0.0-rc.1`
- testnet: `registry.digitalocean.com/aztlan-containers/contract-compiler-testnet:5.0.0-rc.1`
- devnet: `registry.digitalocean.com/aztlan-containers/contract-compiler-devnet:5.0.0-rc.1`

---

## Step 8: Update `docs/ci-cd-migration.md`

Update the Services Migration Status table to mark all services as Done:

```markdown
| explorer-ui-v2 | testnet, mainnet, devnet | — (new service) | explorer-ui-v2.yml | ✅ Done |
| explorer-ui | mainnet, testnet, devnet | k8s/production/explorer-ui/skaffold._.yaml | explorer-ui.yml | ✅ Done |
| explorer-api | mainnet, testnet, devnet | k8s/production/explorer-api/skaffold._.yaml | explorer-api.yml | ✅ Done |
| aztec-listener | mainnet, testnet, devnet | k8s/production/aztec-listener/skaffold._.yaml | aztec-listener.yml | ✅ Done |
| ethereum-listener | mainnet, testnet, devnet | k8s/production/ethereum-listener/skaffold._.yaml | ethereum-listener.yml | ✅ Done |
| websocket-event-publisher | mainnet, testnet, devnet | k8s/production/websocket-event-publisher/skaffold._.yaml | websocket-event-publisher.yml | ✅ Done |
| auth | mainnet | k8s/production/auth/skaffold.yaml | auth.yml | ✅ Done |
| compiler-orchestrator | mainnet, testnet, devnet | k8s/production/compiler-orchestrator/skaffold._.yaml | compiler-orchestrator.yml | ✅ Done |
```

Also add a note under "Notes on Backend Services" — "Building the chicmoz-base image":

```markdown
### Building the chicmoz-base image

Backend services depend on a shared base image (`chicmoz-base`) built from the root `Dockerfile`.
In the new per-service workflows, a `build-base` job builds and pushes this image before the
service build job runs. GHA layer caching (`scope=chicmoz-base`) is shared across all service
workflows, so the base is only rebuilt when the root `Dockerfile` or monorepo package files change.
```

---

## Key Gotchas Summary

1. **`backendRefs.name`, `targetRefs.name`, `extensionRef.name`** — NOT transformed by nameSuffix.
   Always hardcode to the full suffixed name (e.g. `explorer-api-mainnet-service`).

2. **`envFrom.configMapRef.name`** — IS transformed by nameSuffix when the ConfigMap is a resource
   in the same kustomization. Use base names without suffix in the base deployment.

3. **`secretKeyRef`** — cannot go in the base. Use per-overlay strategic merge patches.

4. **Auth has no `nameSuffix`** — `auth-service` must stay exactly `auth-service` for the
   `explorer-api` mainnet `securitypolicy.yaml` extAuth reference to work.

5. **`explorer-ui` uses `ARG BASE`** (old-pattern Dockerfile) — needs a `build-base` job,
   unlike `explorer-ui-v2` which builds standalone from `node:22-alpine`.

6. **`COMPILER_IMAGE` version is hardcoded** in `compiler-orchestrator` overlay patches.
   Update it manually when the contract-compiler image version changes.

7. **Old Skaffold workflows are NOT deleted** — they stay running in parallel.

8. **`explorer-ui` devnet httproute does not exist in old manifests** — create it following
   the testnet pattern. Section names: `ui-devnet-http`, `ui-devnet-https`.
   Hostname: `devnet.aztecscan.xyz`.

9. **`devnet` old workflow used a broken `doctl` command** (missing registry name + sed patch).
   All new workflows use `doctl registries kubernetes-manifest aztlan-containers` consistently.

10. **`VERSION_STRING`** — old pattern used `git describe --tags`. New pattern uses `${{ github.sha }}`
    directly (consistent with `explorer-ui-v2`).
