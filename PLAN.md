# Plan: simplify Aztec package and rollup-version handling

## Goal

Remove the manual rollup-version bookkeeping that currently has to stay in sync
across branches, API code, and UI code.

The final model should be:

- `CHICMOZ_TYPES_AZTEC_VERSION` is removed entirely.
- Chicmoz does not expose or scrape an Aztec npm package version at runtime or
  build time.
- Rollup version is runtime chain data discovered from trusted RPC/block data.
- RPC node version is runtime node metadata discovered from trusted RPCs.
- `explorer-ui-v2` relies on API-provided chain state instead of baked-in rollup
  constants.
- `explorer-ui` v1 gets only the minimum changes needed to avoid drift.

## Current problems

There are currently multiple manually maintained version sources:

- `packages/types/src/aztec/general.ts`
  - `CHICMOZ_TYPES_AZTEC_VERSION = "4.2.0"`
- `services/explorer-api/src/constants/versions.ts`
  - hardcoded rollup-version constants and `CURRENT_ROLLUP_VERSION`
- `services/explorer-ui/src/constants/versions.ts`
  - duplicated rollup-version constants for v1 UI
- `services/explorer-ui-v2/src/constants/versions.ts`
  - duplicated rollup-version constants for v2 UI

The API also still filters many queries by `CURRENT_ROLLUP_VERSION_NUMBER`, which
means a network rollup bump can silently break endpoints until a code constant is
updated and redeployed.

## Important decision: how to detect the current rollup version

Do **not** choose the numerically highest rollup version. Rollup versions are not
guaranteed to increase numerically.

Do **not** simply choose the last reported rollup version. Some RPC nodes may stay
on an older rollup version for some time, and repeated old reports should not make
the old version current again.

Use the rollup version with the latest **first seen** timestamp:

1. For each distinct `rollupVersion`, record when Chicmoz first saw it.
2. The current rollup version is the distinct version whose `firstSeenAt` is most
   recent.

This matches the desired semantics: when a new rollup appears, it becomes current
because its first-seen time is newer than the old version. Nodes that continue to
report the old version do not move the old version forward, because its first-seen
time remains old.

Potential edge cases to handle explicitly:

- If trusted RPC nodes disagree, log/show the split, but still pick the latest
  first-seen version.
- For devnet resets, old DB state may make an old network incarnation look current.
  Use the existing per-network reset/deployment process or add a targeted admin
  reset later if this becomes a real issue.
- Prefer block/header observations as canonical when available; node info is still
  useful for early discovery before blocks arrive.

## Desired data model

Add a small rollup-version observation table in `explorer-api`, or equivalent
Drizzle schema, with one row per `(l2NetworkId, rollupVersion)`:

```ts
{
  l2NetworkId,
  rollupVersion,
  firstSeenAt,
  lastSeenAt,
  firstSeenSource, // e.g. "node-info" | "block"
  lastSeenSource,
}
```

On every trusted observation:

- insert row if `(network, rollupVersion)` does not exist
- preserve `firstSeenAt`
- update `lastSeenAt`
- update source metadata if useful

Current rollup version query:

```sql
select rollup_version
from l2_rollup_version_observation
where l2_network_id = $network
order by first_seen_at desc
limit 1;
```

### Existing data migration

For existing DB data, backfill `firstSeenAt` from the best available existing
timestamp for that version. The intended approximation is:

- `firstSeenAt = lastSeenAt`
- `lastSeenAt = lastSeenAt`

This is good enough for current production data because the purpose of
`firstSeenAt` is ordering distinct already-known rollup versions after the
migration, not reconstructing perfect historical discovery time.

Suggested backfill sources, in order of preference:

1. existing RPC-node `lastSeenAt` grouped by `(l2NetworkId, rollupVersion)`
2. existing chain-info `updatedAt`
3. existing latest block ingestion/update timestamp for that `version`, if a
   block timestamp column is available

If multiple rows exist for the same `(network, rollupVersion)`, use the most
recent available `lastSeenAt` for both `firstSeenAt` and `lastSeenAt`.

## Backend/API changes

### 1. Remove `CHICMOZ_TYPES_AZTEC_VERSION`

Remove this export from:

- `packages/types/src/aztec/general.ts`

Search for imports/usages and remove them. Current research suggests it is only
defined, not used.

Do not replace it with package-json scraping or a generated build-time constant.
The explorer does not need to expose the Aztec npm package version. Runtime
`rollupVersion` and per-RPC `nodeVersion` are enough for explorer behavior and
health/debugging UI.

### 2. Stop using hardcoded API rollup constants as source of truth

Replace `services/explorer-api/src/constants/versions.ts` with either:

- no file, if all imports can be removed; or
- a tiny emergency fallback helper only, e.g. `FALLBACK_ROLLUP_VERSION`, clearly
  documented as bootstrap/emergency-only.

Remove the hardcoded list of rollup versions.

### 3. Add rollup-version observation controller

Add controller functions along these lines:

- `observeRollupVersion({ l2NetworkId, rollupVersion, source })`
- `getCurrentRollupVersion(l2NetworkId)`
- `initializeRollupVersionCache()`

The cache may be in-memory initially. Redis can be added later if needed.

The key behavior is preserving `firstSeenAt` and selecting by latest `firstSeenAt`,
not by numeric value and not by `lastSeenAt`.

### 4. Wire observations from existing ingestion paths

Observe rollup versions from:

- chain info events from `aztec-listener`
- block ingestion in `explorer-api/src/events/received/on-block/index.ts`
  - block header `globalVariables.version`

Block-derived observations should be considered stronger/canonical, but both can
populate the same observation table.

### 5. Fix `getL2ChainInfo`

Current behavior filters by the manual current constant. Change it to return the
latest/current chain info for the requested network without requiring a code-level
rollup match.

If chain-info history by rollup is needed, introduce a separate history table or
endpoint later. For now, keep this minimal: `/l2/info` should return the current
runtime-discovered chain info.

### 6. Replace direct `CURRENT_ROLLUP_VERSION_NUMBER` filters

Update API controllers that currently directly filter with the manual constant.
Use `getCurrentRollupVersion()` instead.

Known places from repo research:

- `services/explorer-api/src/svcs/database/controllers/l2/search.ts`
- `services/explorer-api/src/svcs/database/controllers/l2TxEffect/stats.ts`
- `services/explorer-api/src/svcs/database/controllers/l2contract/get-registered-contract-class.ts`
- `services/explorer-api/src/svcs/database/controllers/l2contract/stats.ts`
- `services/explorer-api/src/svcs/database/controllers/contract-instance-balance/get-balance.ts`
- `services/explorer-api/src/svcs/database/controllers/l2block/add_l1_data.ts`
- any remaining imports of `CURRENT_ROLLUP_VERSION_NUMBER` or
  `CURRENT_ROLLUP_VERSION_BIGINT`

For block lookups and table endpoints that already use `getExistingRollupVersion`,
replace that fallback with the new current-rollup resolver.

### 7. Keep L1 finalization matching safe

When L1 events update L2 block finalization, avoid blindly matching old rollup
blocks. Use the current discovered rollup version, but keep existing archive/hash
checks where available.

If an L1 event arrives before the current version cache is initialized, either:

- resolve from DB on demand, or
- skip and let later reconciliation handle it.

Do not reintroduce hardcoded constants for this.

## Frontend changes

### explorer-ui-v2: primary focus

`services/explorer-ui-v2` should not have baked-in rollup constants.

Remove:

- `services/explorer-ui-v2/src/constants/versions.ts`
- the README mention that `src/constants` is for rollup-version constants

Use API chain info everywhere:

- current rollup version comes from `/l2/info.rollupVersion`
- block version comes from the block header/global variables
- old-rollup detection is:

```ts
BigInt(block.header.globalVariables.version) !== chainInfo.rollupVersion;
```

Add or improve v2 UI indicators where useful:

- block detail page should show a clear old-rollup banner/chip when block version
  differs from current chain info
- health/network views should show current rollup version from chain info
- RPC-node health can still show per-node reported rollup versions, making node
  disagreement visible

### explorer-ui v1: minimum necessary

Do the least possible in v1:

- remove unused version constants if they are truly unused
- keep the existing block-detail comparison against `/l2/info.rollupVersion`
- do not invest in new v1 UX beyond avoiding stale constants/drift

## Suggested implementation order

1. Remove `CHICMOZ_TYPES_AZTEC_VERSION`.
2. Add rollup-version observation schema/controller and migration.
3. Wire observations from chain info and block ingestion.
4. Replace API constant-based rollup filtering with current-rollup resolver.
5. Change `/l2/info` to return runtime-discovered current chain info.
6. Remove frontend rollup constants, starting with `explorer-ui-v2`.
7. Add v2 old-rollup indication if missing.
8. Run focused builds/tests:
   - `yarn workspace @chicmoz-pkg/types build`
   - `yarn workspace explorer-api build`
   - `yarn workspace explorer-ui-v2 build`
   - v1 UI build only if files there changed

## Success criteria

- No `CHICMOZ_TYPES_AZTEC_VERSION` exists.
- No frontend rollup-version constants are needed.
- No API route depends on a manually hardcoded current rollup version.
- A newly discovered trusted rollup version becomes current based on latest
  `firstSeenAt` for that distinct version.
- Old RPC nodes continuing to report an old rollup version do not make that old
  version current again.
- `explorer-ui-v2` can show whether a block belongs to the current rollup version
  using API chain info only.
