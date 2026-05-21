# PLAN3: Disable Eternal Catchup by Default

## Goal

Make request-driven reconciliation the primary repair path and demote eternal catchup to an explicit fallback/disaster-recovery mechanism.

## Preconditions

- PLAN2 has shipped and been observed in devnet/testnet and ideally production.
- Metrics show cadenced reconciliation closes normal missing-block gaps.
- No recurring unrepaired gaps that only eternal catchup fixes.

## Scope

- Disable eternal catchup by default in production configuration.
- Keep a deliberate manual/full-sweep mode for disaster recovery.
- Preserve an easy rollback path.

## Proposed changes

### Aztec listener config

- Change default behavior so eternal catchup is off unless explicitly enabled.
- Prefer renaming semantics in a follow-up-safe way:
  - current: `AZTEC_DISABLE_ETERNAL_CATCHUP`
  - future clearer option: `AZTEC_ENABLE_FULL_SWEEP_CATCHUP`
- For this PR, avoid breaking existing deployments unless intentionally coordinated.

### Kubernetes/env configuration

- Set production/testnet/devnet config explicitly so behavior is obvious.
- Keep rollback simple:
  - set env var to re-enable eternal catchup if request-driven reconciliation underperforms.

### Operational docs

- Document when to use full-sweep catchup:
  - disaster recovery
  - suspected historical gaps beyond reconciliation window
  - Kafka retention/consumer offset incidents
- Document expected normal path:
  - Explorer detects missing ranges
  - Explorer publishes bounded requests
  - listener publishes catchup blocks

### Logging

- Log at startup whether eternal/full-sweep catchup is enabled.
- If disabled, log that request-driven reconciliation is expected to be the primary repair path.

## Tests

- Unit-test/env parse behavior for enabled/disabled modes.
- Verify listener does not call eternal catchup when disabled.
- Verify manual/full-sweep mode still works when enabled.

## Out of scope

- Removing the env var entirely.
- Removing forced-start env vars.
- Removing legacy finalization status.

## Verification

- service-level tests/build for `aztec-listener`
- inspect rendered k8s manifests for expected env values
- deploy to devnet/testnet first and watch reconciliation metrics

## Risk

Medium. This changes a safety-net behavior. Only ship after PLAN2 has enough metrics and observation.
