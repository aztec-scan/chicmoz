# Ethereum Listener Summary

Date: 2026-05-20

> Status note: this was the initial audit summary. The implementation pass that followed fixed several issues called out below. See `WORK-DONE.md` for the concise completion log.

This document summarizes the current `services/ethereum-listener` architecture and the observed runtime behavior on testnet (`ssh quinque`) and mainnet (`chicmoz-prod`).

## Purpose

`ethereum-listener` bridges Aztec L1 contract activity into Chicmoz. It connects to the Ethereum L1 for the active Aztec network, reads Aztec L1 contract logs/state, and publishes typed Kafka messages consumed primarily by `explorer-api`.

It currently covers three broad jobs:

1. **Live L1 event watching** for allowlisted Rollup/Registry events, plus structured Rollup proposal/proof events.
2. **Finalized L1 event polling/backfill** for Rollup `CheckpointProposed`, `L2ProofVerified`, and allowlisted generic events.
3. **Periodic validator snapshot polling** via Rollup staking view calls.

## Startup and services

`src/svcs/index.ts` always starts:

- database service
- Kafka message bus service
- Ethereum network client service
- live events watcher
- finalized events poller
- attester poller

`LISTENER_DISABLED` and `LISTEN_FOR_BLOCKS` are present in env/Kubernetes config, but are not currently used to conditionally register those services.

## L1 clients

`src/network-client/client/index.ts` initializes:

- a WebSocket `PublicClient`
- an HTTP `PublicClient`
- an optional Alchemy HTTP backup client

Live watchers now use WebSocket-backed contracts. Finalized historical polling/backfill still uses HTTP clients as the correctness path.

## Event flow

### Live watcher path

`src/network-client/contracts/watch-events.ts`:

- starts generic watchers only for an allowlist of useful events
- additionally starts explicit Rollup watchers for:
  - `CheckpointProposed`
  - `L2ProofVerified`
- marks those explicit Rollup events with `isFinalized: false`

`CheckpointProposed` and `L2ProofVerified` are excluded from generic watching and handled by structured explicit handlers.

### Finalized polling path

`src/svcs/poller-finalized-events/index.ts` periodically calls `getFinalizedContractEvents()`.

`src/network-client/contracts/get-events.ts` currently structured-finalized-polls:

- `CheckpointProposed`
- `L2ProofVerified`

It also finalized-polls allowlisted generic events. Dormant structured code for `Deposit`, `WithdrawInitiated`, `WithdrawFinalized`, and `Slashed` remains commented out.

Finalized poll results are emitted with `isFinalized: true`.

### Validator snapshot path

`src/svcs/poller-attester-updates/index.ts` runs immediately on startup and then every `ATTESTER_POLL_INTERVAL_MS` (default 15 minutes).

It reads:

- active attester count at the latest finalized L1 height
- attester addresses by index
- attester views by address

Then emits `L1_L2_VALIDATOR_EVENT` with the current snapshot.

## Height/checkpointing model

`src/svcs/database/controllers/heights.ts` stores per-contract/per-event heights for pending/live and finalized paths.

Important details:

- Height storage now uses an atomic upsert.
- Stored heights are monotonic via DB-side `greatest(existing, incoming)` semantics.
- Earliest Rollup L1 block discovery is cached per network/rollup address.

## Runtime observations

### Mainnet: `chicmoz-prod`

Read-only commands used by the runtime sub-agent included:

```sh
kubectl get pods -n chicmoz-prod -o wide
kubectl get deployments -n chicmoz-prod -o wide
kubectl top pods -n chicmoz-prod --containers
kubectl get deployment ethereum-listener-mainnet -n chicmoz-prod -o yaml
kubectl describe pod ethereum-listener-mainnet-795cf96bcf-v8mz8 -n chicmoz-prod
kubectl logs ethereum-listener-mainnet-795cf96bcf-v8mz8 -n chicmoz-prod --since=2h --timestamps
```

Observed state:

- Pod: `ethereum-listener-mainnet-795cf96bcf-v8mz8`
- Namespace: `chicmoz-prod`
- Status: running
- Restarts: 0
- Age at inspection: about 69 minutes
- Deployment: `ethereum-listener-mainnet`, 1/1 replicas
- Env: `L2_NETWORK_ID=MAINNET`, `LISTENER_DISABLED=false`, `LISTEN_FOR_BLOCKS=true`
- Requests/limits: `500m` CPU, `300Mi` memory
- Observed usage: about `94m` CPU, `273Mi` memory

Mainnet looked healthy, but memory was tight at roughly 90%+ of the configured limit.

Logs showed active publishing for:

- `MAINNET_ETH_MAINNET__L1_L2_BLOCK_PROPOSED_EVENT`
- `MAINNET_ETH_MAINNET__L1_L2_PROOF_VERIFIED_EVENT`
- `MAINNET_ETH_MAINNET__L1_GENERIC_CONTRACT_EVENT`
- `MAINNET_ETH_MAINNET__STAKING_ASSET_INFO_EVENT`

Notable log pattern:

- The attester poller no longer intentionally probes past the active attester count and now fails closed rather than publishing partial snapshots.

Operational concern:

- RPC URLs are now redacted in service config logs.

### Testnet/local: `ssh quinque`

Read-only commands used by the runtime sub-agent included:

```sh
ssh quinque 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"'
ssh quinque 'docker exec minikube crictl pods; docker exec minikube crictl ps; docker exec minikube crictl stats'
ssh quinque 'docker exec minikube /var/lib/minikube/binaries/v1.35.1/kubectl --kubeconfig=/etc/kubernetes/admin.conf get pods -n chicmoz -o wide'
ssh quinque 'docker exec minikube /var/lib/minikube/binaries/v1.35.1/kubectl --kubeconfig=/etc/kubernetes/admin.conf get deployments -n chicmoz -o wide'
ssh quinque 'docker exec minikube /var/lib/minikube/binaries/v1.35.1/kubectl --kubeconfig=/etc/kubernetes/admin.conf get deployment ethereum-listener-testnet-deployment -n chicmoz -o yaml'
ssh quinque 'docker exec minikube /var/lib/minikube/binaries/v1.35.1/kubectl --kubeconfig=/etc/kubernetes/admin.conf logs ethereum-listener-testnet-deployment-6f958ddbf9-qzv44 -n chicmoz --since=2h --timestamps'
```

Observed state:

- Pod: `ethereum-listener-testnet-deployment-6f958ddbf9-qzv44`
- Namespace: `chicmoz`
- Status: running
- Main container restarts: 0
- Init container restarts: 2, then completed successfully
- Deployment: `ethereum-listener-testnet-deployment`, 1/1 replicas
- Env: `L2_NETWORK_ID=TESTNET`, `LISTENER_DISABLED=false`, `LISTEN_FOR_BLOCKS=true`
- Requests/limits: `500m` CPU, `300Mi` memory
- Observed via `crictl stats`: about `14%` CPU and `283.4MB` memory

Testnet was alive and backfilling. Logs showed it closing a large finalized-log gap:

- initially about `492679` blocks behind
- later about `123269` blocks behind

Backfill loop duration was mostly ~2.1s to ~2.7s while behind.

Notable log patterns:

- Catch-up ETA now skips ETA output when no progress was made, avoiding `Infinity hrs`.

## Current resource judgment

CPU usage appears appropriate for the job as observed. Memory is the main concern:

- both mainnet and testnet were near the 300Mi limit
- neither showed restarts in the inspected windows
- the block timestamp cache is now bounded and generic watchers are allowlisted; memory should be re-observed after deployment

The service should probably either reduce memory growth/noise or get a modest memory limit bump after observing longer-term trends.

## Current finalization model

The current model mixes:

1. Aztec node chain progress
2. L1 listener observation method (`watchEvent` vs finalized polling)
3. UI display states

`ethereum-listener` emits Rollup proposal/proof events with `isFinalized` based on whether the log came from live watching or finalized polling. `explorer-api` maps that into the six-value `ChicmozL2BlockFinalizationStatus` enum.

The service now publishes/stores factual L1 transaction identity for proposal/proof events. The larger `getL2Tips()` status migration is intentionally deferred.
