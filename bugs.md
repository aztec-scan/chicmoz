# Explorer API - Bug Fix Plan

Based on analysis of `todo-bugs.md`. Bugs #6, #7, #8, #9, #11 dropped (already fixed, intentional, or deferred).

---

## Bug #1 -- Wrong HTTP status codes (500 -> 400) [FIXED]

**File:** `services/explorer-api/src/svcs/http-server/routes/controllers/contract-instances.ts`

**Problem:** Server returns 500 for client validation failures (bad input), not server errors.

**Fix:**

- Line ~370: Change `res.status(500)` to `res.status(400)` for bytecode mismatch
- Line ~437-440: Change `res.status(500)` to `res.status(400)` for deployment address mismatch

---

## Bug #2 -- No cache invalidation when `deployerMetadata` is absent [FIXED]

**File:** `services/explorer-api/src/svcs/http-server/routes/controllers/contract-instances.ts`

**Problem:** When instance verification succeeds but no `deployerMetadata` is provided, the handler returns 200 without updating the Redis cache. Stale data (without `verifiedDeploymentArguments`) served until 60s TTL expires.

**Fix:** Before the early return, fetch fresh instance from DB and update the Redis cache (same pattern as the `deployerMetadata` branch).

---

## Bug #3 -- Fragile string equality for artifact comparison [FIXED]

**File:** `services/explorer-api/src/svcs/http-server/routes/controllers/contract-instances.ts`

**Problem:** Raw JSON string comparison fails for semantically identical artifacts with different key ordering or whitespace.

**Fix:** Replaced string comparison with `verifyArtifactPayload` bytecode verification.

---

## Bug #4 -- Missing `contractName` when storing artifact via instance verification [FIXED]

**File:** `services/explorer-api/src/svcs/http-server/routes/controllers/contract-instances.ts`

**Problem:** `addArtifactData` call during instance verification omitted `contractName`, causing `artifactContractName: null` in the DB.

**Fix:** Destructure `artifactContractName` from `verifyArtifactPayload` result and pass it to both `addArtifactData` and the cache entry.

---

## Bug #5 -- Dead code (unreachable null check) [FIXED]

**File:** `services/explorer-api/src/svcs/http-server/routes/controllers/contract-instances.ts`

**Problem:** Zod `.parse()` throws on invalid data, never returns falsy. The `if (!dbContractClass)` check was dead code.

**Fix:** Wrapped `.parse()` in try-catch to correctly return 500 on invalid DB data.

---

## Bug #10 -- No ClientTrafficPolicy for devnet [FIXED]

**File:** New: `k8s/production/explorer-api/devnet/clienttrafficpolicy.yaml`

**Problem:** Envoy Gateway defaults to ~1MB body size. Large artifacts rejected with 413.

**Fix:** Created `ClientTrafficPolicy` with 50MB limit matching nginx config on testnet/mainnet.

---

## Dropped Bugs

| Bug                                  | Reason                                                            |
| ------------------------------------ | ----------------------------------------------------------------- |
| #6 (aztecScanNotes stripped in prod) | Intentional security measure                                      |
| #7 (skipped tests)                   | Deferred -- needs dynamic fixture strategy for Aztec SDK upgrades |
| #8 (unsafe `?? "{}"` fallback)       | Kept as-is -- mismatch caught by verify step                      |
| #9 (auth GET-only for ext-auth)      | Already fixed (`router.all`)                                      |
| #11 (extAuth YAML indentation)       | Already fixed (`extAuth` under `spec`)                            |
