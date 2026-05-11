# CI/CD Migration Guide: From Skaffold to GitHub Actions + Kustomize

## Overview

This document describes the new production CI/CD pattern for Chicmoz services, introduced with `explorer-ui-v2` as the reference implementation. The goal is to decouple **local development** (Skaffold) from **production deployments** (GitHub Actions + Kustomize), making production deploys more explicit, auditable, and independent of local tooling.

---

## The Two-Track System

| Concern               | Tool                                | Location                                         |
| --------------------- | ----------------------------------- | ------------------------------------------------ |
| **Local development** | Skaffold (unchanged)                | `k8s/local/<service>/`                           |
| **Production CI/CD**  | GitHub Actions + `kubectl apply -k` | `services/<service>/k8s/` + `.github/workflows/` |

### Why this split?

**Old pattern problems:**

- Skaffold configs under `k8s/production/` were used by both CI and local manual deploys — unclear which was the source of truth
- `deploy-*.sh` scripts invoked Skaffold, which then built images and applied manifests in one step — hard to re-run just the deploy stage without rebuilding
- Per-network flat YAML with no concept of a base — changes to shared config (resources, probes, labels) had to be applied to every network file individually
- No Docker layer caching in CI — every deploy rebuilt from scratch

**New pattern benefits:**

- CI builds the image once and pushes it — the deploy step is a pure `kubectl apply -k`, no rebuild
- GitHub Actions layer caching (`type=gha`) makes rebuilds fast when source hasn't changed
- Kustomize `base/` defines the shared config once — overlays only specify what differs per network (namespace, image tag, env-specific patches)
- `workflow_dispatch` on workflows allows manual re-deploys without a code push
- `production-testnet` / `production-devnet` / `production` branch model is preserved — workflows are path-filtered so only changed services trigger

---

## Old Pattern (Current, Skaffold-based)

```
.github/workflows/aztecscan-prod-testnet.yml
  └── runs scripts/production/deploy-testnet.sh
        └── skaffold run -f k8s/production/skaffold.testnet.yaml
              ├── builds all images (explorer-ui, explorer-api, aztec-listener, ...)
              └── applies k8s/production/<service>/testnet/*.yaml for each service
```

Every push to `production-testnet` rebuilds and redeploys **all services**, even if only one changed.

---

## New Pattern (GitHub Actions + Kustomize)

```
.github/workflows/<service>.yml   ← one workflow per service (handles all networks)
  ├── set-up job   → determine network from branch, install doctl + kubectl, cache tools
  ├── build job    → resolve network-specific VITE vars, docker buildx + push,
  │                  GHA layer cache, sha + network-latest tags
  └── deploy job   → kubectl apply -k services/<service>/k8s/overlays/{network}/
                      kubectl rollout restart deployment/<service>-{network} -n chicmoz-prod
                      kubectl rollout status deployment/<service>-{network} -n chicmoz-prod
```

Each workflow is **path-filtered** — only triggers when files under `services/<service>/` change. Services deploy independently. **Network is derived from the branch** that triggered the push:

| Branch               | Network   |
| -------------------- | --------- |
| `production`         | `mainnet` |
| `production-testnet` | `testnet` |
| `production-devnet`  | `devnet`  |

For manual deploys via `workflow_dispatch`, the network is selected from a dropdown input.

---

## Kustomize Structure Explained

Each service gets a `k8s/` directory co-located inside its service folder:

```
services/<service>/
└── k8s/
    ├── base/
    │   ├── kustomization.yaml   ← lists resources (deployment, service only — NOT httproute)
    │   ├── deployment.yaml      ← no namespace, no image tag — just the shape
    │   └── service.yaml
    └── overlays/
        ├── testnet/
        │   ├── kustomization.yaml   ← namespace, nameSuffix: -testnet, image newTag: testnet-latest
        │   └── httproute.yaml       ← testnet-specific: parentRefs, hostname, backendRef
        ├── mainnet/
        │   ├── kustomization.yaml   ← namespace, nameSuffix: -mainnet, image newTag: mainnet-latest
        │   └── httproute.yaml       ← mainnet-specific: parentRefs, hostname, backendRef
        └── devnet/
            ├── kustomization.yaml   ← namespace, nameSuffix: -devnet, image newTag: devnet-latest
            └── httproute.yaml       ← devnet-specific: parentRefs, hostname, backendRef
```

### Why `httproute.yaml` lives in the overlay, not the base

The `HTTPRoute` resource is **entirely network-specific** — every field differs per network:

- `parentRefs.sectionName` — the gateway listener (e.g. `ui-v2-testnet-http` vs `ui-v2-mainnet-http`)
- `hostnames` — the public hostname (e.g. `v2.testnet.aztecscan.xyz` vs `v2.aztecscan.xyz`)
- `backendRefs.name` — the service name including network suffix (e.g. `explorer-ui-v2-testnet`)

There is no meaningful "base" for an httproute. Putting it in the base would require overriding every field via patches, which is more complex than just writing a plain file per overlay.

> **`backendRefs.name` must be hardcoded** to the suffixed service name (e.g. `explorer-ui-v2-testnet`). Kustomize's `nameSuffix` does **not** automatically update `backendRefs` references — it only transforms `metadata.name`. The httproute's own `metadata.name` can use the base name (e.g. `explorer-ui-v2`) and `nameSuffix` will append the suffix correctly. But `backendRefs.name` must explicitly reference the final suffixed service name.

### `base/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - httproute.yaml
```

### `overlays/testnet/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: chicmoz-prod
nameSuffix: -testnet

resources:
  - ../../base
  - httproute.yaml

images:
  - name: registry.digitalocean.com/aztlan-containers/<service>
    newTag: testnet-latest
```

### `overlays/testnet/httproute.yaml`

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: <service> # nameSuffix appends -testnet → becomes <service>-testnet
  namespace: chicmoz-prod
spec:
  parentRefs:
    - name: aztecscan-gateway
      sectionName: <service>-testnet-http
    - name: aztecscan-gateway
      sectionName: <service>-testnet-https
  hostnames:
    - <subdomain>.testnet.aztecscan.xyz
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: <service>-testnet # hardcoded — nameSuffix does NOT transform backendRefs
          port: 80
```

---

## GitHub Actions Workflow Structure

Reference: `.github/workflows/explorer-ui-v2.yml`

```yaml
name: CI/CD <Service>

on:
  push:
    branches:
      - production-testnet
      - production
      - production-devnet
    paths:
      - "services/<service>/**" # path filter — only triggers on changes to this service
  workflow_dispatch: # allows manual re-deploy from GitHub UI
    inputs:
      network:
        description: "Network to deploy to"
        required: true
        type: choice
        options: [testnet, mainnet, devnet]

env:
  REGISTRY: registry.digitalocean.com/aztlan-containers
  CLUSTER_NAME: aztecscan-prod
  IMAGE_NAME: <service>

jobs:
  set-up: # determines network from branch or dispatch input, installs doctl + kubectl, caches by date
  build: # resolves network-specific VITE vars, docker buildx, pushes {network}-latest + {network}-{sha}
  deploy: # kubectl apply -k overlays/{network}/, rollout restart, rollout status
```

### Network Detection (set-up job)

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
    fi
```

The derived `network` value is passed as a job output (`needs.set-up.outputs.network`) and used throughout the workflow for image tags, build args, Kustomize overlay path, and deployment name.

### Network-Specific Build Args (frontend services)

Frontend services resolve per-network `VITE_*` vars in a `build-args` step using a `case` statement before the Docker build:

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

Backend services have no build-time env vars — all config is injected at runtime via K8s Secrets.

### Image Tagging Convention

| Tag              | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `testnet-latest` | Always points to the most recent testnet deploy — used by Kustomize overlay |
| `testnet-{sha}`  | Immutable SHA tag — used for rollback reference                             |

Same pattern for `mainnet-` and `devnet-` prefixes.

### Tool Caching

Tools (`doctl`, `kubectl`) are installed once in `set-up` and cached by date using `actions/cache@v4`. Subsequent jobs restore from cache via `fail-on-cache-miss: true`. This avoids re-downloading on every job.

---

## Step-by-Step Migration Checklist

For each service being migrated from the old Skaffold-based CI to the new pattern:

### Step 1 — Create `services/<service>/k8s/base/`

Copy the existing flat manifests from `k8s/production/<service>/{network}/` into the base, then generalise them:

- Remove `namespace:` from all resources (set by overlay)
- Remove the image tag from `deployment.yaml` (set by overlay)
- Add `imagePullPolicy: Always` to the container spec
- Add `livenessProbe` and `readinessProbe` if missing (check port name matches)
- Add `requests` alongside `limits` in resources
- Create `base/kustomization.yaml` listing all resources

### Step 2 — Create `services/<service>/k8s/overlays/{network}/kustomization.yaml`

One overlay per network the service is deployed to:

```yaml
namespace: chicmoz-prod
resources:
  - ../../base
images:
  - name: registry.digitalocean.com/aztlan-containers/<service>-{network}
    newTag: {network}-latest
```

Add `patches:` for any network-specific env vars or config (e.g. different DB names, RPC URLs).

For services with environment variables injected via K8s Secrets (e.g. `aztec-listener`, `ethereum-listener`, `explorer-api`), keep using `secretKeyRef` in the base deployment — the secret is created by the workflow before `kubectl apply -k`.

### Step 3 — Create `.github/workflows/<service>.yml`

Use `explorer-ui-v2.yml` as the template. **One file per service** — it handles all networks by deriving the target network from the branch. Key things to customise:

- `on.push.paths` — `services/<service>/**`
- `IMAGE_NAME` — the image name in the registry
- `build.build-args` — all `ARG` values from the service's `Dockerfile`
- For frontend services: add the `Resolve network-specific build args` step with the correct per-network `VITE_*` values
- For backend services: add a step to `kubectl create secret generic ...` before `kubectl apply -k`, keyed by `${{ needs.set-up.outputs.network }}` (see `aztecscan-prod-testnet.yml` for reference on how secrets are currently injected)
- `deploy` step targets `services/<service>/k8s/overlays/${{ needs.set-up.outputs.network }}/`

### Step 4 — Add gateway listeners (if new hostname)

If the service uses a new hostname not already in the gateway:

- **Local**: add a listener to `k8s/local/gateways/testnet/gateway.yaml` (or sandbox/remote_devnet as needed)
- **Production**: add HTTP + HTTPS listeners to `k8s/production/gateways/gateway.yaml`

### Step 5 — Add TLS certificate (if new hostname)

Add a `cert-manager` `Certificate` resource to `k8s/production/gateways/{network}/certificates.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: aztecscan-<name>-tls-{network}
  namespace: chicmoz-prod
spec:
  secretName: aztecscan-<name>-tls-{network}
  issuerRef:
    name: aztecscan-issuer-production
    kind: ClusterIssuer
  dnsNames:
    - <hostname>
```

### Step 6 — Remove service from `k8s/production/skaffold.{network}.yaml`

Comment out or remove the line pointing to the service's old Skaffold config:

```yaml
# - path: ./explorer-ui/skaffold.testnet.yaml   ← removed, now handled by GitHub Actions
```

### Step 7 — Archive or remove `k8s/production/<service>/`

The flat per-network manifests under `k8s/production/<service>/` are superseded by the Kustomize base in `services/<service>/k8s/`. Once the new workflow is tested and running, these old files can be removed to avoid confusion about which is the source of truth.

> **Note:** Do not remove the old files until the new workflow has successfully deployed at least once. Keep a reference until you're confident.

---

## Reference Implementation: `explorer-ui-v2`

`explorer-ui-v2` is the first service using the new pattern. Use it as the canonical example.

| File                                                              | Purpose                                         |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| `services/explorer-ui-v2/k8s/base/kustomization.yaml`             | Base resource list                              |
| `services/explorer-ui-v2/k8s/base/deployment.yaml`                | Generic deployment — no namespace, no image tag |
| `services/explorer-ui-v2/k8s/base/service.yaml`                   | ClusterIP service                               |
| `services/explorer-ui-v2/k8s/overlays/testnet/kustomization.yaml` | Testnet: sets namespace + pins image tag        |
| `services/explorer-ui-v2/k8s/overlays/testnet/httproute.yaml`     | Testnet HTTPRoute — `v2.testnet.aztecscan.xyz`  |
| `services/explorer-ui-v2/k8s/overlays/mainnet/kustomization.yaml` | Mainnet: sets namespace + pins image tag        |
| `services/explorer-ui-v2/k8s/overlays/mainnet/httproute.yaml`     | Mainnet HTTPRoute — `v2.aztecscan.xyz`          |
| `services/explorer-ui-v2/k8s/overlays/devnet/kustomization.yaml`  | Devnet: sets namespace + pins image tag         |
| `services/explorer-ui-v2/k8s/overlays/devnet/httproute.yaml`      | Devnet HTTPRoute — `v2.devnet.aztecscan.xyz`    |
| `.github/workflows/explorer-ui-v2.yml`                            | Single workflow — all networks, branch-derived  |
| `k8s/local/explorer-ui-v2/skaffold.testnet.yaml`                  | Local dev — Skaffold unchanged                  |

---

## Services Migration Status

| Service                     | Networks                 | Old Skaffold files                                         | New workflow                    | Status  |
| --------------------------- | ------------------------ | ---------------------------------------------------------- | ------------------------------- | ------- |
| `explorer-ui-v2`            | testnet, mainnet, devnet | — (new service)                                            | `explorer-ui-v2.yml`            | ✅ Done |
| `explorer-ui`               | mainnet, testnet, devnet | `k8s/production/explorer-ui/skaffold.*.yaml`               | `explorer-ui.yml`               | ✅ Done |
| `explorer-api`              | mainnet, testnet, devnet | `k8s/production/explorer-api/skaffold.*.yaml`              | `explorer-api.yml`              | ✅ Done |
| `aztec-listener`            | mainnet, testnet, devnet | `k8s/production/aztec-listener/skaffold.*.yaml`            | `aztec-listener.yml`            | ✅ Done |
| `ethereum-listener`         | mainnet, testnet, devnet | `k8s/production/ethereum-listener/skaffold.*.yaml`         | `ethereum-listener.yml`         | ✅ Done |
| `websocket-event-publisher` | mainnet, testnet, devnet | `k8s/production/websocket-event-publisher/skaffold.*.yaml` | `websocket-event-publisher.yml` | ✅ Done |
| `auth`                      | mainnet                  | `k8s/production/auth/skaffold.yaml`                        | `auth.yml`                      | ✅ Done |
| `compiler-orchestrator`     | mainnet, testnet, devnet | `k8s/production/compiler-orchestrator/skaffold.*.yaml`     | `compiler-orchestrator.yml`     | ✅ Done |

---

## Notes on Backend Services

Backend services (everything except the UI services) have additional concerns vs the frontend:

### Building the chicmoz-base image

Backend services depend on a shared base image (`chicmoz-base`) built from the root `Dockerfile`.
In the new per-service workflows, a `build-base` job builds and pushes this image before the
service build job runs. GHA layer caching (`scope=chicmoz-base`) is shared across all service
workflows, so the base is only rebuilt when the root `Dockerfile` or monorepo package files change.

### Secrets injection

Currently secrets are injected via `kubectl create secret generic` in the deploy script before Skaffold runs. In the new pattern, this moves into the GitHub Actions workflow's `deploy` job, before the `kubectl apply -k` step:

```yaml
- name: Inject network config secret
  run: |
    kubectl create secret generic testnet-config \
      --from-literal=SOME_SECRET_KEY=${{ secrets.SOME_SECRET }} \
      --namespace chicmoz-prod \
      --dry-run=client -o yaml | kubectl apply -f -
```

### Database migrations

Services that run DB migrations via an init container (e.g. `explorer-api`, `aztec-listener`) keep the same `initContainers` pattern in the base `deployment.yaml` — Kustomize carries these through to the overlay unchanged.

### Building internal workspace package dependencies

In the `chicmoz-base` pattern, all internal packages (e.g. `@chicmoz-pkg/types`) were pre-built as part of constructing the base image. In the new pattern there is no base image — `yarn workspaces focus` only installs npm dependencies, it does **not** compile workspace packages.

Any `workspace:^` dependency listed in the service's `package.json` must be explicitly built in the Dockerfile **before** the service build step:

```dockerfile
# Install only the deps needed for this workspace
RUN yarn workspaces focus @chicmoz/<service>

# Build internal workspace dependencies first
RUN yarn workspace @chicmoz-pkg/types build
# Add one line per internal workspace:^ dependency

# Build the service
RUN yarn workspace @chicmoz/<service> build
```

**How to find which packages to build:** check `dependencies` in the service's `package.json` for entries with `"workspace:^"`. Each one needs a `yarn workspace <name> build` step.

**`.dockerignore` note:** the `!packages/<name>` entries in `.dockerignore` whitelist the full package directory tree (source, tsconfig, etc.), so no additional entries are needed for packages already listed there. If you add a new internal package dependency that isn't yet whitelisted, add `!packages/<name>` to `.dockerignore`.

### VITE\_\* build args (frontend only)

Only frontend services (`explorer-ui`, `explorer-ui-v2`) use `build-args` in the Docker build step. Backend services have no build-time env vars — all config is injected at runtime via K8s Secrets or ConfigMaps.

### `.dockerignore` whitelist — new-pattern services only

The root `.dockerignore` starts with `*` (exclude everything) and then whitelists specific files. For the **old `chicmoz-base` pattern** (`explorer-ui` and all backend services), this is fine — the base image already contains the full monorepo, and the service Dockerfile only needs `package.json` from the root context.

For **new-pattern services** (like `explorer-ui-v2`) that build from the monorepo root without `chicmoz-base`, the `.dockerignore` must explicitly whitelist every file the build needs. The `package.json` entry alone is not enough.

When migrating a service to the new pattern, add all of the following to `.dockerignore`:

```
!services/<service>/package.json
!services/<service>/tsconfig.json
!services/<service>/tsconfig.app.json
!services/<service>/tsconfig.node.json
!services/<service>/vite.config.ts      # frontend only
!services/<service>/index.html          # frontend only
!services/<service>/postcss.config.js   # frontend only
!services/<service>/tailwind.config.js  # frontend only
!services/<service>/src
```

For backend services, replace the frontend-specific entries with whatever config files the service needs (e.g. `tsconfig.json`, `src/`).

> **Symptom if missing:** The Docker build will fail with `Cannot read file '/app/services/<service>/tsconfig.json'` or similar — TypeScript or Vite can't find files that were excluded by `.dockerignore` before they reached the build context.
