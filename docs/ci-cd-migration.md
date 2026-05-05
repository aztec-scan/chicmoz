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
.github/workflows/<service>-{network}.yml   ← one workflow per service per network
  ├── set-up job   → install doctl + kubectl, cache tools
  ├── build job    → docker buildx + push, GHA layer cache, sha + network-latest tags
  └── deploy job   → kubectl apply -k services/<service>/k8s/overlays/{network}/
                      kubectl rollout restart deployment/<service> -n chicmoz-prod
                      kubectl rollout status deployment/<service> -n chicmoz-prod
```

Each workflow is **path-filtered** — only triggers when files under `services/<service>/` change. Services deploy independently.

---

## Kustomize Structure Explained

Each service gets a `k8s/` directory co-located inside its service folder:

```
services/<service>/
└── k8s/
    ├── base/
    │   ├── kustomization.yaml   ← lists resources (deployment, service, httproute)
    │   ├── deployment.yaml      ← no namespace, no image tag — just the shape
    │   ├── service.yaml
    │   └── httproute.yaml
    └── overlays/
        ├── testnet/
        │   └── kustomization.yaml   ← namespace: chicmoz-prod, image newTag: testnet-latest
        ├── mainnet/
        │   └── kustomization.yaml   ← namespace: chicmoz-prod, image newTag: mainnet-latest
        └── devnet/
            └── kustomization.yaml   ← namespace: chicmoz-prod, image newTag: devnet-latest
```

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

resources:
  - ../../base

images:
  - name: registry.digitalocean.com/aztlan-containers/<service>
    newTag: testnet-latest

# Optional: network-specific patches
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
                  - name: SOME_NETWORK_SPECIFIC_VAR
                    value: "testnet-value"
```

---

## GitHub Actions Workflow Structure

Reference: `.github/workflows/explorer-ui-v2-testnet.yml`

```yaml
name: CI/CD <Service> — <Network>

on:
  push:
    branches: [production-testnet] # production | production-testnet | production-devnet
    paths:
      - "services/<service>/**" # path filter — only triggers on changes to this service
  workflow_dispatch: # allows manual re-deploy from GitHub UI

env:
  REGISTRY: registry.digitalocean.com/aztlan-containers
  CLUSTER_NAME: aztecscan-prod
  IMAGE_NAME: <service>

jobs:
  set-up: # installs doctl + kubectl, caches them by date
  build: # docker buildx, pushes {network}-latest + {network}-{sha}
  deploy: # kubectl apply -k, rollout restart, rollout status
```

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

### Step 3 — Create `.github/workflows/<service>-{network}.yml`

Use `explorer-ui-v2-testnet.yml` as the template. Key things to customise:

- `on.push.branches` — the relevant production branch
- `on.push.paths` — `services/<service>/**`
- `IMAGE_NAME` — the image name in the registry
- `build.build-args` — all `ARG` values from the service's `Dockerfile`
- For backend services: add a step to `kubectl create secret generic ...` before `kubectl apply -k` (see `aztecscan-prod-testnet.yml` for reference on how secrets are currently injected)
- `deploy` step: `kubectl apply -k services/<service>/k8s/overlays/{network}/`

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

| File                                                              | Purpose                                          |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| `services/explorer-ui-v2/k8s/base/kustomization.yaml`             | Base resource list                               |
| `services/explorer-ui-v2/k8s/base/deployment.yaml`                | Generic deployment — no namespace, no image tag  |
| `services/explorer-ui-v2/k8s/base/service.yaml`                   | ClusterIP service                                |
| `services/explorer-ui-v2/k8s/base/httproute.yaml`                 | Gateway HTTPRoute for `v2.testnet.aztecscan.xyz` |
| `services/explorer-ui-v2/k8s/overlays/testnet/kustomization.yaml` | Testnet: sets namespace + pins image tag         |
| `.github/workflows/explorer-ui-v2-testnet.yml`                    | Full build + deploy workflow                     |
| `k8s/local/explorer-ui-v2/skaffold.testnet.yaml`                  | Local dev — Skaffold unchanged                   |

---

## Services Migration Status

| Service                     | Networks                 | Old Skaffold files                                         | New workflow                 | Status     |
| --------------------------- | ------------------------ | ---------------------------------------------------------- | ---------------------------- | ---------- |
| `explorer-ui-v2`            | testnet                  | — (new service)                                            | `explorer-ui-v2-testnet.yml` | ✅ Done    |
| `explorer-ui`               | mainnet, testnet, devnet | `k8s/production/explorer-ui/skaffold.*.yaml`               | —                            | ⏳ Pending |
| `explorer-api`              | mainnet, testnet, devnet | `k8s/production/explorer-api/skaffold.*.yaml`              | —                            | ⏳ Pending |
| `aztec-listener`            | mainnet, testnet, devnet | `k8s/production/aztec-listener/skaffold.*.yaml`            | —                            | ⏳ Pending |
| `ethereum-listener`         | mainnet, testnet, devnet | `k8s/production/ethereum-listener/skaffold.*.yaml`         | —                            | ⏳ Pending |
| `websocket-event-publisher` | mainnet, testnet, devnet | `k8s/production/websocket-event-publisher/skaffold.*.yaml` | —                            | ⏳ Pending |
| `auth`                      | mainnet                  | `k8s/production/auth/skaffold.yaml`                        | —                            | ⏳ Pending |
| `compiler-orchestrator`     | mainnet, testnet, devnet | `k8s/production/compiler-orchestrator/skaffold.*.yaml`     | —                            | ⏳ Pending |

---

## Notes on Backend Services

Backend services (everything except the UI services) have additional concerns vs the frontend:

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

### VITE\_\* build args (frontend only)

Only frontend services (`explorer-ui`, `explorer-ui-v2`) use `build-args` in the Docker build step. Backend services have no build-time env vars — all config is injected at runtime via K8s Secrets or ConfigMaps.
