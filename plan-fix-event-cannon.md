# Plan: Fixing `event-cannon` contract scenario failures

This document is a step-by-step workflow for troubleshooting and fixing failing `event-cannon` scenarios (for example `VotingContract` reverts) using:

- `event-cannon` logs
- `aztec-sandbox-node` logs
- (optional) `event-logs` / explorer logs

The goals are to:

1. Reproduce the failure consistently
2. Correlate the failing transaction across services
3. Extract the _real_ revert reason (or at least narrow down the class of failure)
4. Apply a targeted code/config fix
5. Validate via redeploy

---

## 0) Set up a minimal repro

Start by running as few scenarios as possible. In `k8s/local/event-cannon/deployment.yaml`, set only the target scenario(s) to `true`.

Example (only voting enabled):

- `SCENARIO_SIMPLE_DEFAULT_ACCOUNT=true`
- `SCENARIO_FUNCTIONS_VOTE=true`
- everything else `false`

Then redeploy:

```bash
skaffold run -f k8s/local/skaffold.only_event-cannon.yaml
```

---

## 1) Reproduce and capture the failing tx hashes

Get fresh `event-cannon` logs:

```bash
kubectl logs -n chicmoz deploy/event-cannon-deployment -c event-cannon --tail 200
```

Then extract the failure lines / tx hashes:

```bash
kubectl logs -n chicmoz deploy/event-cannon-deployment -c event-cannon --since=20m \
  | rg -n "Running scenario|📫 TX|app_logic_reverted|Error running scenario"
```

Record:

- scenario name (e.g. `SCENARIO_FUNCTIONS_VOTE`)
- tx hash that reverted (the one in `app_logic_reverted`)
- any nearby warnings, especially PXE concurrency warnings

---

## 2) Correlate the same tx in `aztec-sandbox-node` logs

Search sandbox node logs for the exact tx hash.

Quick tail:

```bash
kubectl logs -n chicmoz deployments/aztec-sandbox-node --tail 60
```

Search by tx hash (preferred):

```bash
TX=0xDEADBEEF...
kubectl logs -n chicmoz deployments/aztec-sandbox-node --since=30m \
  | rg -n "$TX"
```

If you can’t find the tx hash, search around the time window, or look for block numbers printed by `event-cannon` (`⛏ ... block N`).

---

## 3) Check `event-logs` / explorer pipeline (when the issue is “missing indexed data”)

If the transaction succeeds on-chain (node logs show inclusion) but explorer/event-logs do not show the expected data:

```bash
kubectl logs -n chicmoz deployments/event-logs --tail 200
```

Explorer API service (if deployed as a k8s deployment):

```bash
kubectl logs -n chicmoz deployments/explorer-api-sandbox --tail 200
```

Then correlate by block number / contract address / tx hash.

---

## 4) Extract a revert reason (don’t guess)

### 4.1 Add a `simulate()` preflight

For scenarios that send transactions, add a preflight `simulate()` _with the exact same args and `from`_ before calling `.send()`.

Purpose:

- If `simulate()` fails: it’s likely a contract precondition / input / state issue.
- If `simulate()` passes but `send()` fails: it’s likely concurrency, state sync, or transient sequencer/PXE issues.

### 4.2 Capture more context on failure

When a tx fails, log:

- method name
- args
- `from` address
- any nonces used
- contract address
- recent block number / chain id

---

## 5) Common failure classes and fixes

### A) Wrong sender (`from`) / auth witness mismatch

Symptoms:

- `app_logic_reverted` on simple public/private transfers

Fix:

- Ensure the tx is sent from the same account implied by the method (`transfer_in_public(from, ...)` must be sent by `from`, etc.)

### B) PXE concurrency / pipeline contention

Symptoms:

- `PXE is already processing ... jobs, concurrent execution is not supported`
- subsequent private call reverts

Fix:

- Run scenario actions sequentially (no `Promise.all` for tx sends)
- avoid doing long-running non-chain requests in parallel with private tx work
- add small retry/backoff for transient failures

### C) Indexing delay (explorer/event-logs)

Symptoms:

- tx executes, but explorer data isn’t available immediately

Fix:

- only add “wait for indexing” before _reads_ that require it
- implement polling until found (with timeout), rather than a fixed sleep

---

## 6) Validate after each change

Redeploy:

```bash
skaffold run -f k8s/local/skaffold.only_event-cannon.yaml
```

Then confirm:

```bash
kubectl logs -n chicmoz deploy/event-cannon-deployment -c event-cannon --since=20m \
  | rg -n "app_logic_reverted|Error running scenario" || true
```

---

## 7) Handy one-liners

Get last lines from key services:

```bash
kubectl logs -n chicmoz deployments/aztec-sandbox-node --tail 60
kubectl logs -n chicmoz deploy/event-cannon-deployment -c event-cannon --tail 120
kubectl logs -n chicmoz deployments/event-logs --tail 120
```

Search for errors across a window:

```bash
kubectl logs -n chicmoz deploy/event-cannon-deployment -c event-cannon --since=30m \
  | rg -n "WARN|error:|app_logic_reverted|Error running scenario"
```
