# Ethereum Listener Summary

Date: 2026-05-20

This document summarizes the current `services/ethereum-listener` architecture and the observed runtime behavior on testnet (`ssh quinque`) and mainnet (`chicmoz-prod`).

## Purpose

`ethereum-listener` bridges Aztec L1 contract activity into Chicmoz. It connects to the Ethereum L1 for the active Aztec network, reads Aztec L1 contract logs/state, and publishes typed Kafka messages consumed primarily by `explorer-api`.

It currently covers three broad jobs:

1. **Live L1 event watching** for Rollup/Registry/Inbox/Outbox/FeeJuicePortal events.
2. **Finalized L1 event polling/backfill** for Rollup `CheckpointProposed` and `L2ProofVerified`.
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

However, `getL1Contracts()` builds all typed contracts with the HTTP client, so current `contract.watchEvent.*` usage appears to be HTTP polling rather than true WebSocket subscriptions.

## Event flow

### Live watcher path

`src/network-client/contracts/watch-events.ts`:

- starts one generic watcher for every event in each configured contract ABI
- additionally starts explicit Rollup watchers for:
  - `CheckpointProposed`
  - `L2ProofVerified`
- marks those explicit Rollup events with `isFinalized: false`

This means `CheckpointProposed` and `L2ProofVerified` are watched both generically and via the structured explicit handlers.

### Finalized polling path

`src/svcs/poller-finalized-events/index.ts` periodically calls `getFinalizedContractEvents()`.

`src/network-client/contracts/get-events.ts` currently finalized-polls only:

- `CheckpointProposed`
- `L2ProofVerified`

It has dormant code for `Deposit`, `WithdrawInitiated`, `WithdrawFinalized`, and `Slashed`, but those calls are commented out.

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

- Height storage is update-then-insert, not an atomic upsert.
- Stored heights are overwritten with the provided height; no DB-side monotonic guard prevents regressions.
- `inMemoryHeightTracker()` calls `getEarliestRollupBlockNumber()` for every tracker creation.
- If no DB row exists, `getHeights()` uses a cached earliest-block promise, but the tracker itself bypasses that cache and does the earliest-rollup lookup again.

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

- Every ~15 minutes, the attester poller logs `GSE__OutOfBounds` around the end of the validator list.
- This appears to be expected boundary probing, but it is noisy and warning-level.

Operational concern:

- Logs include raw RPC URLs. This risks exposing provider URLs/tokens in log aggregation and support output.

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

- `estimated time to catch up: Infinity hrs` appears when the catch-up estimate divides by zero/no progress.
- Same expected-but-noisy `GSE__OutOfBounds` warning pattern as mainnet.

## Current resource judgment

CPU usage appears appropriate for the job as observed. Memory is the main concern:

- both mainnet and testnet were near the 300Mi limit
- neither showed restarts in the inspected windows
- the unbounded block timestamp cache and broad event watcher set are plausible contributors to memory pressure over long runtimes

The service should probably either reduce memory growth/noise or get a modest memory limit bump after observing longer-term trends.

## Current finalization model

The current model mixes:

1. Aztec node chain progress
2. L1 listener observation method (`watchEvent` vs finalized polling)
3. UI display states

`ethereum-listener` emits Rollup proposal/proof events with `isFinalized` based on whether the log came from live watching or finalized polling. `explorer-api` maps that into the six-value `ChicmozL2BlockFinalizationStatus` enum.

Now that Aztec nodes expose `getL2Tips()` with `proposed`, `checkpointed`, `proven`, and `finalized`, the ethereum listener should eventually stop owning block-status semantics. It should publish factual L1 proposal/proof metadata, including L1 tx hashes, and let `aztec-listener`/`explorer-api` derive user-facing status from Aztec-native tips.
