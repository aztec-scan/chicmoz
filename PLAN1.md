# PLAN1: Native Tips Health Endpoint, Docs, and Tests

## Goal

Complete the additive native L2 tips rollout by making tip state observable and documented before relying on it operationally.

## Scope

- Add a read-only API endpoint for latest stored L2 tips.
- Expose freshness/degraded state clearly.
- Add OpenAPI/docs for `nativeStatus` and tips.
- Add focused tests for native tip storage and status derivation.

## Proposed changes

### Explorer API

- Add endpoint, for example:
  - `GET /l2/tips`
  - or include in an existing network-health endpoint if one is preferred.
- Response should include:
  - `tips`
  - `observedAt`
  - `stale: boolean`
  - `stalenessMs`
  - `degraded: boolean`
  - `degradedReason?: string`
  - `source.rpcNodeName?`
  - `source.aztecNodeVersion?`
- Add an env-backed stale threshold, e.g. `L2_TIPS_STALE_AFTER_MS`, with a conservative default.
- Update OpenAPI response schemas.

### Docs/API contract

- Document that `nativeStatus` is additive and preferred for display.
- Document that legacy `finalizationStatus` remains for compatibility until a later PR.
- Document Aztec v4 caveat: upstream `finalized` may equal `proven`.
- Add product wording for `checkpointed` and `unknown`.

### Tests

- Unit-test `deriveNativeStatus`:
  - no tips => `unknown`
  - stale/degraded tips => `unknown`
  - proposed/checkpointed/proven/finalized thresholds
  - orphaned block => `unknown`
  - height above proposed => `unknown`
  - v4 `finalized === proven` case
- Unit-test `upsertTips` boundary validation:
  - matching boundary block
  - missing boundary block
  - mismatched boundary hash
- Add a lightweight route test for the tips endpoint.

## Out of scope

- Removing legacy finalization status.
- Cadenced catchup.
- Disabling eternal catchup.

## Verification

- `yarn build:packages`
- focused `explorer-api` tests for tips/status logic
- `yarn lint` or service/package lint as appropriate

## Risk

Low. This is additive/read-only and improves observability before later removals.
