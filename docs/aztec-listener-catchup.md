# Aztec Listener Catchup Modes

Normal missing-block repair is request-driven:

1. `explorer-api` detects missing block ranges from its stored chain state.
2. `explorer-api` publishes bounded `L2_BLOCK_RANGE_REQUEST_EVENT` requests.
3. `aztec-listener` clamps each request to current Aztec node tips, fetches blocks through Aztec RPC, and republishes ordinary `CATCHUP_BLOCK_EVENT` messages.

## Full-sweep catchup

Full-sweep catchup is disabled by default. It is a deliberate fallback for cases where bounded reconciliation is not enough, such as:

- disaster recovery after a bad deployment or data loss;
- suspected historical gaps beyond the reconciliation scan window;
- Kafka retention or consumer-offset incidents that may have skipped old blocks.

Enable it only intentionally:

```yaml
- name: AZTEC_ENABLE_FULL_SWEEP_CATCHUP
  value: "true"
```

For rollback compatibility, the older `AZTEC_DISABLE_ETERNAL_CATCHUP` variable is still accepted when `AZTEC_ENABLE_FULL_SWEEP_CATCHUP` is unset. New manifests should prefer the explicit enable variable.

At startup the listener logs whether full-sweep catchup is enabled. When disabled, request-driven reconciliation is expected to be the primary repair path.
