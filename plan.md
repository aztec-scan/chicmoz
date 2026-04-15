## Bigint and Fr Numeric Handling Plan

### Context

`explorer-api` on testnet is failing to store some incoming blocks with an error like:

```text
value "9718204179553100000" is out of range for type bigint
```

This is not an isolated bad value. It exposes a broader modeling problem in the codebase: several Aztec `Fr`-derived values are currently treated as ordinary machine integers in both TypeScript and Postgres.

### What is currently happening

The current data path is roughly:

1. Aztec block data is parsed.
2. Some `Fr` values are converted to JavaScript `number`.
3. Those values are written into Postgres `bigint` columns.

This is unsafe for two separate reasons:

1. JavaScript `number` loses integer precision above `2^53 - 1`.
2. Postgres signed `bigint` overflows above `9223372036854775807`.

So even before a DB insert fails, some values may already have been rounded incorrectly in memory.

### Confirmed findings

#### 1. Immediate failing path

The live stack trace points at block ingestion in `explorer-api`, specifically the `txEffect` insert path.

Relevant file:

- `services/explorer-api/src/svcs/database/controllers/l2block/store.ts`

The most likely failing field is:

- `tx_effect.transaction_fee`

Reasoning:

- The stack trace points into the `txEffect` insert block.
- The failing value `9718204179553100000` is above Postgres signed `bigint` max.
- `transactionFee` is stored using `generateFrNumberColumn`, which maps to Postgres `bigint`.

#### 2. Unsafe schema helper

Relevant file:

- `services/explorer-api/src/svcs/database/schema/utils.ts`

Current helper:

```ts
export const generateFrNumberColumn = (name: string) =>
  bigint(name, { mode: "number" });
```

This helper is fundamentally unsafe for general `Fr` values.

#### 3. Unsafe TypeScript parsing

Relevant file:

- `packages/types/src/aztec/utils.ts`

Current logic:

```ts
export const frNumberSchema = z.preprocess((val) => {
  if (typeof val === "number") {
    return val;
  }
  const v = frToHexString(val);
  if (typeof v === "string") {
    return parseInt(v, 16);
  }
  return val;
}, z.coerce.number());
```

Problems:

- `parseInt(v, 16)` returns a JavaScript `number`
- any large integer above `2^53 - 1` is no longer exact
- the code then passes that unsafe value deeper into the application

#### 4. Existing good pattern already in repo

The codebase already handles larger numeric values correctly in some places.

Relevant files:

- `services/explorer-api/src/svcs/database/schema/utils.ts`
- `services/explorer-api/src/svcs/database/schema/l2block/header.ts`
- `services/explorer-api/migrations/0010_total_fees_mana_numeric.sql`

Example:

```ts
export const generateUint256Column = (name: string) =>
  numeric(name, { precision: 77, scale: 0 });
```

`totalFees` and `totalManaUsed` were already migrated from `bigint` to `numeric(77, 0)`.

This is the strongest existing precedent for the broader fix.

### Scope of the broader problem

The issue is bigger than `transactionFee`.

Current `generateFrNumberColumn()` usage includes:

- `services/explorer-api/src/svcs/database/schema/l2block/body.ts`
  - `tx_effect.transaction_fee`
- `services/explorer-api/src/svcs/database/schema/l2block/header.ts`
  - `global_variables.chain_id`
  - `global_variables.version`
  - `global_variables.block_number`
  - `global_variables.slot_number`
  - `gas_fees.fee_per_da_gas`
  - `gas_fees.fee_per_l2_gas`
- `services/explorer-api/src/svcs/database/schema/l2block/root.ts`
  - `l2_block.version`
- `services/explorer-api/src/svcs/database/schema/l2block/l1-data.ts`
  - `l1_block_timestamp`
- `services/explorer-api/src/svcs/database/schema/l1/generic-contract-event.ts`
  - `l1_block_timestamp`

Not all of these are equally risky.

There are likely three categories:

1. Values that are truly field elements and can exceed signed 64-bit.
2. Values that are logically bounded integers, but are currently passed through `Fr` parsing.
3. Values that are timestamps or counters and should remain numeric, but need explicit reasoning and guarantees.

### Core problem statement

The current design conflates two different ideas:

1. A value is represented in Aztec as an `Fr`
2. A value is semantically a small integer that safely fits in JS `number` and Postgres `bigint`

Those are not the same thing.

The code currently assumes that many `Fr` values can be treated as ordinary integers. That assumption is no longer safe.

### Recommended design direction

Use this rule:

- If a value may exceed JS safe integer or Postgres `bigint`, do not represent it as `number`.
- Store large integer values in Postgres as `numeric(77, 0)`.
- Represent those values in application and JSON layers as strings.

This matches the existing pattern already used for `uint256` values in the repo.

### Proposed solution

#### Phase 1: classify all current `Fr number` fields

For every current `generateFrNumberColumn()` usage, decide whether it should be:

1. `numeric(77, 0)` plus string in TypeScript and JSON
2. `bigint` plus `bigint` in TypeScript
3. `number` only if there is a strong semantic guarantee it is small and bounded

Working assumption right now:

- `transactionFee` should move to `numeric(77, 0)` plus string
- `feePerDaGas` should move to `numeric(77, 0)` plus string
- `feePerL2Gas` should move to `numeric(77, 0)` plus string

Fields that may remain small but still need explicit validation before leaving them as-is:

- `chainId`
- `version`
- `blockNumber`
- `slotNumber`
- `l1BlockTimestamp`

#### Phase 2: replace unsafe type parsing

Current `frNumberSchema` is not safe for large values.

Options:

1. Replace it with a string-returning schema for large integer values.
2. Split it into multiple schemas, for example:
   - `frDecimalStringSchema`
   - `frBigIntSchema`
   - `frSmallNumberSchema`

Recommended direction:

- stop using one generic `frNumberSchema` for mixed semantics
- introduce explicit schemas based on the intended meaning of the value

This should make it impossible to accidentally parse a full-width field element into an imprecise JS number.

#### Phase 3: migrate storage types

For fields classified as large integer values:

1. change schema definitions from `bigint(..., { mode: "number" })`
2. move them to `numeric(77, 0)`
3. update insert paths to pass string values
4. update read paths and Zod schemas accordingly

At minimum, likely migration targets are:

- `tx_effect.transaction_fee`
- `gas_fees.fee_per_da_gas`
- `gas_fees.fee_per_l2_gas`

Potential migration targets depending on classification outcome:

- `global_variables.chain_id`
- `global_variables.version`
- `global_variables.block_number`
- `global_variables.slot_number`
- `l2_block.version`
- `l1_block_timestamp` columns

#### Phase 4: update API contracts

Changing these fields away from JS `number` affects:

- cached API responses
- DB serialization
- UI consumers
- any sorting/filtering assumptions in code

Example areas already known to depend on these fields:

- `packages/types/src/aztec/l2TxEffect.ts`
- `packages/types/src/aztec/l2Block.ts`
- `packages/types/src/aztec/ui.ts`
- `packages/types/src/aztec/special.ts`
- `services/explorer-api/src/svcs/database/controllers/ui/tables.ts`
- `services/explorer-api/src/svcs/database/controllers/l2TxEffect/get-tx-effect.ts`
- `services/explorer-ui/src/pages/tx-effect-details/utils.ts`
- `services/explorer-ui/src/components/tx-effects/tx-effects-columns.tsx`

The likely API shape for large fee-like values should be string, not number.

#### Phase 5: verification

After the refactor:

1. ingest blocks containing very large fee values
2. verify block storage succeeds
3. verify tx effect pages still render
4. verify UI tables render fee values correctly
5. verify cached endpoints serialize without bigint/JSON issues
6. verify sorting behavior where numeric strings are displayed or manipulated

### Recommended implementation shape

#### Suggested schema split

Instead of one `frNumberSchema`, create explicit schemas with semantics in the name.

Possible split:

- `frSchema`
  - for hex-string field elements
- `frDecimalStringSchema`
  - for large numeric values that should be stored and serialized as decimal strings
- `frTimestampSchema`
  - for timestamps
- `frSmallIntSchema`
  - only for values with strong bounded guarantees

This should reduce future ambiguity substantially.

#### Suggested DB helper split

Instead of one `generateFrNumberColumn`, create helpers that reflect real storage semantics.

Possible split:

- `generateFrColumn`
  - varchar hex field element
- `generateLargeIntegerColumn`
  - `numeric(77, 0)`
- `generateTimestampColumn`
  - current timestamp representation
- explicit `integer` or `bigint` helpers for bounded counters only

### Risks and compatibility concerns

#### 1. Existing API consumers may assume numbers

If `transactionFee` changes from `number` to `string`, frontend rendering and any formatting logic must be updated.

#### 2. Cached data shape may change

Redis payloads for affected endpoints may contain old numeric data and new string data across deployments.

Need to decide whether:

- cache keys should change
- caches should be flushed
- or code should temporarily tolerate both shapes

#### 3. Existing DB data may already be imprecise

If values larger than JS safe integer were previously parsed through `frNumberSchema`, some stored values may already be rounded.

That means a schema migration alone may not guarantee historical correctness.

Potential remediation:

- accept old rows as-is and fix forward only
- or reingest affected block/tx data from source if historical precision matters

#### 4. Numeric sorting semantics

If a value becomes a string in the API layer, UI sorting must not accidentally become lexicographic when numeric ordering is intended.

### Recommended rollout order

1. Classify all current `Fr number` fields.
2. Convert the clearly unsafe fee-like fields to `numeric(77, 0)` plus string.
3. Update API schemas and UI consumers for those fields.
4. Run ingestion verification against blocks with large fees.
5. Expand conversion to other fields if classification shows they are not safely bounded.

### Minimal acceptable first milestone

If the larger cleanup needs to be split into stages, the first milestone should still be structural, not just a one-off patch.

Minimum useful milestone:

1. introduce explicit parsing/storage semantics for large numeric Fr values
2. migrate `transactionFee`, `feePerDaGas`, `feePerL2Gas`
3. update all affected API and UI types

This would fix the current live issue and remove the most obvious repeat failure points.

### Research still needed before implementation

No further research was done beyond the current code inspection and live log evidence. The following still needs explicit confirmation during implementation:

1. Which current `generateFrNumberColumn()` fields are semantically guaranteed to remain within JS safe integer and signed 64-bit bounds.
2. Whether `chainId`, `version`, `blockNumber`, and `slotNumber` should remain numeric or also move to string/numeric modeling.
3. Whether `l1_block_timestamp` fields are truly safe as `bigint`/number or should be modeled differently.
4. Whether any external consumers rely on fee fields being JSON numbers.
5. Whether existing persisted rows need reingestion because of prior precision loss.
6. Whether cache invalidation is needed when response shapes change.
7. Whether any DB indexes or query patterns need adjustment after moving columns to `numeric(77, 0)`.

### Summary

This should be treated as a type-system and storage-modeling cleanup, not just a single overflow fix.

The key principle is:

- large Aztec numeric values should not flow through JavaScript `number`
- and should not be stored in Postgres `bigint` unless they are explicitly bounded

The existing `numeric(77, 0)` pattern in the repo provides the right direction for the broader solution.
