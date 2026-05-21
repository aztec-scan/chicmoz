# PLAN4: Remove Legacy Catchup Env Knobs

## Goal

Remove old operator knobs that are no longer needed once Explorer-driven reconciliation and explicit full-sweep recovery are proven.

## Preconditions

- PLAN2 and PLAN3 have shipped.
- Cadenced reconciliation is stable.
- Full-sweep/manual recovery has a clear replacement command/config.
- Operators no longer rely on forced-start or ignore-processed-height behavior for normal recovery.

## Scope

Remove or replace:

- `IGNORE_PROCESSED_HEIGHT`
- `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`
- `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT`
- Possibly `AZTEC_DISABLE_ETERNAL_CATCHUP`, if replaced by clearer full-sweep config.

## Proposed changes

### Code cleanup

- Remove env parsing for unused catchup knobs from `services/aztec-listener/src/environment.ts`.
- Remove startup config printing for removed vars.
- Remove forced-start plumbing from poller startup if no replacement path needs it.
- Remove ignore-processed-height behavior from height initialization/storage logic if still present.

### Replacement operator path

- If operators still need a manual repair path, prefer one explicit action:
  - publish manual `L2_BLOCK_RANGE_REQUEST_EVENT`, or
  - enable a clearly named full-sweep/manual mode temporarily.
- Document exact command/process for manual gap repair.

### Kubernetes/docs cleanup

- Remove deleted env vars from:
  - service base overlays
  - local/staging/production manifests
  - README/env docs
  - CI/CD migration docs if still relevant
- Make sure no deployment references removed variables.

## Tests

- Build `aztec-listener` after env removal.
- Search repo for removed env names; only historical changelog references should remain, if any.
- Verify default listener startup still initializes heights and follows live head.
- Verify manual range request remains the documented replacement.

## Out of scope

- Removing legacy finalization status.
- Removing L1 metadata ingestion.
- Changing normal block polling semantics beyond env cleanup.

## Verification

- `yarn build:packages`
- `aztec-listener` lint/build/test
- repo-wide search for removed env names
- render/check k8s manifests if available

## Risk

Medium. This removes operator escape hatches. Do it only after replacement operational workflows are documented and tested.
