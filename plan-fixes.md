Plan 1: Fix stale l2_tips.degraded_reason
Diagnosis
l2_tips.degraded_reason is set when boundary validation fails, but later healthy observations do not clear it back to NULL.
Current DB evidence:

- tip boundary hashes now match DB rows
- but degraded_reason = "proposed boundary block 86936 is missing"
- API therefore keeps returning nativeStatus: "unknown"
  Fix
  In services/explorer-api/src/svcs/database/controllers/l2/tips.ts:

1. Ensure degradedReason is explicitly nullable in the DB write path.
2. On every successful tips event:

- run boundary validation
- if all boundaries pass, write degradedReason: null
- if validation fails, write the reason string
  Likely code shape:
  const values = flattenTips({ ...event, tips }, degradedReason ?? null);
  And make flattenTips accept:
  degradedReason: string | null
  not string | undefined.
  Verification
  After deploy:
  SELECT degraded_reason FROM l2_tips;
  Expected:
  NULL
  Then check internal API:
  /l2/blocks/latest -> nativeStatus: proposed/checkpointed/proven/finalized
  /l2/ui/blocks-for-table -> nativeStatus present and not all unknown
  Regression test
  Add a small unit test for tips storage/derivation:

1. First event with missing boundary sets degraded reason.
2. Later event with matching boundaries clears degraded reason.
3. deriveNativeStatus() returns non-unknown after clear.
   Plan 2: Fix /l1/contract-events/hourly-counts?hours=24 SQL GROUP BY error
   Diagnosis
   Postgres error:
   column "l1_generic_contract_event.l1_block_timestamp" must appear in the GROUP BY clause or be used in an aggregate function
   This means the query groups by some bucket/expression but selects or orders by raw l1_block_timestamp.
   Fix
   Find the controller for hourly counts, likely under:
   services/explorer-api/src/svcs/database/controllers/l1/generic-contract-event/get.ts
   services/explorer-api/src/svcs/http-server/routes/controllers/l1/contract-events.ts
   Change the query so every selected non-aggregate field is either:

- the same bucket expression used in GROUP BY, or
- aggregated with min() / max(), or
- removed from select/order.
  Preferred query shape:
  SELECT
  date_trunc('hour', to_timestamp(l1_block_timestamp / 1000)) AS hour,
  count(\*) AS count
  FROM l1_generic_contract_event
  WHERE l1_block_timestamp >= ...
  GROUP BY hour
  ORDER BY hour ASC;
  In Drizzle terms:
- define the hourBucket SQL expression once
- select it as hour
- groupBy(hourBucket)
- orderBy(hourBucket)
  Do not order by raw l1BlockTimestamp.
  Verification
  Call:
  /l1/contract-events/hourly-counts?hours=24
  Expected:
- HTTP 200
- array of hourly buckets
- no SQL error in logs
  Regression test
  Add controller/API test:
- seed events across multiple hours
- assert grouped counts
- assert empty hours behavior if expected by API contract
  Plan 3: Fix too-wide block range requests causing 500 / public 504
  Diagnosis
  Internal API error:
  GET /l2/blocks?from=86910&to=86936
  500 Invalid range: too wide of a range requested
  Public API sometimes waits until upstream timeout and returns 504.
  There are two problems:

1. API treats a client range that is too wide as an internal error.
2. Public route timeout hides the useful validation message.
   Fix
   3A. Return 400 instead of 500 for invalid ranges
   Where range validation happens, likely in:
   services/explorer-api/src/svcs/database/controllers/utils.ts
   services/explorer-api/src/svcs/database/controllers/l2block/get-block.ts
   services/explorer-api/src/svcs/http-server/routes/controllers/blocks.ts
   Introduce or use a typed client error, e.g. BadRequestError, for:
   Invalid range: too wide of a range requested
   If the project already maps thrown errors to HTTP status, use that pattern. Otherwise add controller-level validation before DB call:
   if (to - from > DB_MAX_BLOCKS) {
   res.status(400).json({
   message: `Range too wide. Maximum is ${DB_MAX_BLOCKS} blocks.`,
   });
   return;
   }
   3B. Make API behavior match UI pagination
   The UI/table endpoint already returns bounded lists. For /l2/blocks, decide one of:
   Option 1 — strict:

- max to - from <= DB_MAX_BLOCKS
- return 400 with clear message if exceeded
  Option 2 — forgiving:
- clamp to max range
- include only latest/first DB_MAX_BLOCKS
- maybe return metadata indicating truncation
  For public APIs, I recommend strict 400 because silent clamping can confuse SDK users.
  3C. Avoid slow 504 on public route
  Once the app returns 400 before expensive DB work, the public gateway should stop timing out for oversized ranges.
  Verification
  Internal:
  /l2/blocks?from=86923&to=86936
  If above max, expected:
  400
  { "message": "Range too wide..." }
  Small range:
  /l2/blocks?from=86934&to=86936
  Expected:
  200
  Public should match status and response shape.
  Regression test
  Add route/controller tests:

1. valid small range returns 200
2. too-wide range returns 400
3. malformed range returns 400
4. no unhandled error log for expected validation failure
