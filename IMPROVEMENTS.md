# Improvements

Issues identified after the `feat: verify source code (#598)` deployment to devnet.

## 🔥 Root Cause Analysis: `explorer-api-devnet` CrashLoopBackOff

**Pod:** `explorer-api-devnet-deployment-*` — 110+ restarts observed.

### Summary

The explorer-api runs with `--unhandled-rejections=strict` (see `package.json` line 69)
and has **zero retry logic** for its PostgreSQL connection (see `packages/postgres-helper/src/svc.ts` line 38-50).
Any transient failure during the sequential startup — DB connection, `initializeProtocolContracts()`,
or Kafka subscription — causes an immediate `process.exit(1)`, and K8s restarts the pod into
`CrashLoopBackOff` with exponential backoff (up to 5 min between attempts).

### Most Likely Crash Scenarios (in order of probability)

#### 1. PostgreSQL connection failure — no retries (HIGH probability)

**File:** `packages/postgres-helper/src/svc.ts` (lines 38–50)

The DB `init()` calls `pool.connect()` with a 5-second timeout and **no retry logic**.
If PostgreSQL is momentarily unavailable (e.g., the pod restarted, a brief network
partition, or connection limit reached), the process exits immediately.

Compare this to the _migration_ init container (`services/explorer-api/scripts/migrate-db.ts`),
which has **50 retries with exponential backoff** for `ECONNREFUSED`. The main container
has zero retries.

In a CrashLoopBackOff scenario, the K8s backoff timer (10s → 20s → 40s → … → 5min) means
the pod may try to connect at the worst possible time and fail again, creating a stable
crash loop even if the underlying issue was transient.

**Status:** Accepted behavior. The K8s restart loop effectively acts as a retry mechanism.
The process fails fast and lets the container restart, which is sufficient.

#### 2. `initializeProtocolContracts()` OOM or unhandled error (MEDIUM probability)

**File:** `services/explorer-api/src/utils/protocol-contracts.ts` (lines 73–92)

During `start()`, the explorer-api calls `getContractClassFromArtifact()` from `@aztec/stdlib`
for every protocol contract. This:

- Loads the `@aztec/bb.js` Barretenberg backend (native binary or WASM fallback)
- Computes Poseidon2 hashes over the contract bytecode
- Is CPU and memory intensive

The explorer-api has a **300Mi memory limit** vs 2000Mi for `aztec-listener`. If Barretenberg
initializes its WASM backend (128MB+ heap) or if multiple protocol contracts are processed
with large artifacts, the process can exceed 300Mi and be OOM-killed.

An OOM kill looks like a crash to K8s — the exit code is 137 (SIGKILL), and the pod restarts.

**Note:** This function is NOT wrapped in try/catch (unlike `initializeRollupVersionCache()`
which is). Any error here crashes the process.

**Fix (immediate):** Increase memory limit to at least 1000Mi:

```yaml
resources:
  limits:
    memory: 1000Mi
    cpu: 500m
```

**Fix (longer term):** Wrap `initializeProtocolContracts()` in try/catch in `start.ts`,
and consider lazy initialization.

#### 3. Kafka subscription exhausts retries (MEDIUM probability)

**File:** `packages/message-bus/src/svc.ts` (lines 74–101)

The `subscribeHandlers()` call in `start.ts` (line 48) subscribes to **14 Kafka topics**
in parallel via `Promise.all()`. Each subscription uses `exponential-backoff` with the
default of **10 attempts** max.

If Kafka is slow or the new `DEVNET__COMPILE_SOURCE_RESULT_EVENT` topic doesn't exist
yet (the topic is only created when the `compiler-orchestrator` first publishes to it),
the subscription retries 10 times and then throws. This propagates through
`Promise.all()` → `start()` → `process.exit(1)`.

Kafka auto-topic-creation is **not explicitly configured** in the Kafka deployment
(`k8s/production/kafka/kafka.yaml`). Apache Kafka 4.1.1 defaults to
`auto.create.topics.enable=true` for KRaft mode, but if this was ever overridden, the
topic won't exist until the compiler-orchestrator creates it.

**Status:** Accepted behavior. The K8s restart loop effectively acts as a retry mechanism.
The process fails fast and lets the container restart, which is sufficient.

### Crash Loop Amplification

Once the pod enters CrashLoopBackOff, K8s applies exponential backoff (10s, 20s, 40s, 80s,
160s, 300s cap). Each restart attempt runs the full startup sequence:

1. **Init container** (migration) — has 50 retries, usually succeeds
2. **Main container** startup — sequential init of DB → Redis → HTTP → Kafka
3. If DB is briefly slow at the exact moment the container starts → crash
4. Wait 5 min → try again → DB might be slow again → stable crash loop

The **absence of any startup retry logic** in the main container means a single transient
failure cascades into 110+ restarts.

### Not the Cause (investigated and ruled out)

These were investigated as potential causes and definitively ruled out.
Documented here to avoid re-investigation.

#### Node 20→22 / Alpine→Debian base image change

All services switched from `node:20-alpine` (build stage in root `Dockerfile`) to
`node:22-trixie-slim` (runtime stage in each service Dockerfile). This was investigated
as a potential cause of native module incompatibility.

**Finding:** Not a cause. The native modules in `@aztec/bb.js` (Barretenberg) are
**pre-built glibc binaries** shipped in the npm package — they are NOT compiled during
`yarn install` on Alpine. Specifically:

- `bb` (ELF executable) requires GLIBC ≥ 2.39 — Debian Trixie provides 2.41 ✅
- `nodejs_module.node` requires GLIBC ≥ 2.38 and GLIBCXX ≥ 3.4.32 — Trixie satisfies both ✅
- Uses N-API v1 (`napi_register_module_v1`) which is ABI-stable across Node.js versions ✅
- `@crate-crypto/node-eth-kzg` is also pre-built glibc (requires GLIBC ≥ 2.28) ✅
- bb.js has a WASM fallback if native binaries fail for any reason ✅

The dependency chain: `explorer-api` → `@aztec/stdlib` → `@aztec/foundation` → `@aztec/bb.js`.

#### Migration failures

Migrations 0010 (`source_verification_jobs` table + nullable columns) and 0011
(`client_ip` column) are additive and idempotent:

- `CREATE TABLE IF NOT EXISTS` — safe to re-run
- `ADD COLUMN` — wrapped in `DO $$ BEGIN ... EXCEPTION WHEN ... END $$` by Drizzle
- The init container migration script has **50 retries** with exponential backoff

#### Kafka message handling at runtime

All Kafka consumer callbacks are wrapped in try/catch in
`packages/message-bus/src/class.ts` (lines 204-218). A malformed message or handler
error will be logged but will NOT crash the process. The crash risk is only during
**subscription setup** (see Scenario 3), not during message processing.

#### Drizzle schema / migration mismatch

The `sourceVerificationJobs` table schema in TypeScript
(`services/explorer-api/src/svcs/database/schema/l2contract/index.ts` lines 291-308)
was verified to align exactly with migration 0010 + 0011:

- All columns match (id, contract_class_id, version, github_url, git_ref, sub_path,
  aztec_version, commit_hash, client_ip, status, error, created_at, updated_at)
- The `source_verification_status` enum values match
- The `sourceCode` and `sourceCodeCommitHash` columns on `l2_contract_class_registered`
  match the migration ALTER TABLE statements

---

## 🔴 Critical

### 1. Missing `imagePullSecrets` on dynamically spawned K8s Jobs

**Service:** `compiler-orchestrator`
**File:** `services/compiler-orchestrator/src/svcs/job-manager/index.ts` (lines 151–248)

The compiler-orchestrator creates Kubernetes Jobs to compile contracts. The Job pod
template spec is missing `imagePullSecrets`. The compiler image
(`registry.digitalocean.com/aztlan-containers/contract-compiler:4.0.3`) is hosted in a
**private** DigitalOcean Container Registry, so every spawned Job fails with
`ImagePullBackOff`.

**Fix:** Add a configurable `IMAGE_PULL_SECRET` environment variable and inject it into
the Job spec.

`services/compiler-orchestrator/src/environment.ts`:

```ts
export const IMAGE_PULL_SECRET = z
  .string()
  .optional()
  .parse(process.env.IMAGE_PULL_SECRET);
```

`services/compiler-orchestrator/src/svcs/job-manager/index.ts` — inside the Job
template `spec` (line 179):

```ts
spec: {
  restartPolicy: "Never",
  automountServiceAccountToken: false,
  imagePullSecrets: IMAGE_PULL_SECRET
    ? [{ name: IMAGE_PULL_SECRET }]
    : undefined,
  // ...existing fields
}
```

`k8s/production/compiler-orchestrator/devnet/deployment.yaml` — add env var:

```yaml
- name: IMAGE_PULL_SECRET
  value: "registry-aztlan-containers"
```

> Apply the same change to the mainnet and testnet deployment manifests.

---

### 2. Unhandled `publishMessage` in failure paths crashes the process

**Service:** `compiler-orchestrator`
**File:** `services/compiler-orchestrator/src/svcs/job-manager/index.ts`

The Dockerfile runs Node with `--unhandled-rejections=strict`, meaning any unhandled
promise rejection terminates the process. Two code paths call `publishMessage` without
a surrounding `try/catch`:

- `handleJobFailure` (line 420) — called when a Job fails (e.g. `ImagePullBackOff`).
- `handleJobCompletion` catch block (line 399) — fallback publish after
  `readResultsFromJobPod` throws.

If Kafka is momentarily unreachable when either of these executes, the rejection
propagates past the poll-loop `.catch()` in specific edge cases and kills the process.

**Fix:** Wrap both `publishMessage` calls in `try/catch`:

```ts
const handleJobFailure = async (state: JobState): Promise<void> => {
  activeJobs.delete(state.jobId);
  const reason = await getJobFailureReason(state);
  const status =
    reason === "timeout"
      ? ("timeout" as const)
      : ("compilation_failed" as const);

  logger.warn(`Job failed: ${state.k8sJobName}, reason: ${reason}`);

  try {
    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: state.jobId,
      contractClassId: state.contractClassId,
      version: state.version,
      status,
      error: reason,
    });
  } catch (e) {
    logger.error(
      `Failed to publish failure result for jobId=${state.jobId}: ${(e as Error).message}`,
    );
  }
};
```

Apply the same pattern to the catch block inside `handleJobCompletion` (lines 394–406).

---

## 🟡 High

### 3. No liveness or readiness probes on `compiler-orchestrator`

**File:** `k8s/production/compiler-orchestrator/devnet/deployment.yaml`

The deployment has no health probes. When the orchestrator crashes (see issue #2) it
enters `CrashLoopBackOff` with exponential backoff (up to 5 min between restarts).
Additionally, the `health()` function unconditionally returns `true`, so even a
non-functional pod is never restarted proactively.

**Fix:** Add probes to the container spec:

```yaml
livenessProbe:
  exec:
    command: ["node", "-e", "process.exit(0)"]
  initialDelaySeconds: 30
  periodSeconds: 30
readinessProbe:
  exec:
    command: ["node", "-e", "process.exit(0)"]
  initialDelaySeconds: 10
  periodSeconds: 10
```

> Ideally, expose an HTTP health endpoint and probe that instead.

---

## 🟡 Medium

### 4. `sourceCode` JSONB fetched in every contract class query

**Service:** `explorer-api`
**File:** `services/explorer-api/src/svcs/database/controllers/l2contract/utils.ts` (lines 90–100)

`getContractClassRegisteredColumns()` only excludes `artifactJson` but the table now
also has `sourceCode` (potentially large JSONB with full Noir source files) and
`sourceCodeCommitHash`. These are fetched on **every** contract class and contract
instance query, only to be stripped by Zod `.parse()`. As verified contracts
accumulate this will degrade API performance and increase memory pressure.

**Fix:** Exclude the new columns from the default projection:

```ts
export const getContractClassRegisteredColumns = (
  includeArtifactJson?: boolean,
) => {
  const { artifactJson, sourceCode, sourceCodeCommitHash, ...columns } =
    getTableColumns(l2ContractClassRegistered);
  return {
    ...columns,
    ...(includeArtifactJson ? { artifactJson } : {}),
  };
};
```

---

### 5. `SELECT *` used for counting active verification jobs

**Service:** `explorer-api`
**File:** `services/explorer-api/src/svcs/database/controllers/l2contract/source-verification.ts` (lines 121–152)

`getActiveVerificationJobCount` and `getActiveJobCountByIp` fetch all matching rows
into memory and return `result.length`. These run on every verification submission to
enforce rate limits.

**Fix:** Use `SELECT COUNT(*)` instead:

```ts
const result = await db()
  .select({ count: sql<number>`count(*)` })
  .from(sourceVerificationJobs)
  .where(
    inArray(sourceVerificationJobs.status, [
      "PENDING",
      "COMPILING",
      "VERIFYING",
    ]),
  );
return result[0]?.count ?? 0;
```

Also add an index on `status`:

```sql
CREATE INDEX idx_source_verification_jobs_status
  ON source_verification_jobs (status);
```

---

## 🟢 Low

### 6. RBAC inconsistency between devnet and mainnet/testnet

**Files:**

- `k8s/production/compiler-orchestrator/devnet/rbac.yaml`
- `k8s/production/compiler-orchestrator/mainnet/rbac.yaml`

The devnet Role is missing `pods` `create`/`delete` verbs and
`persistentvolumeclaims` permissions that are present in mainnet/testnet. Not
currently a crash cause, but should be kept in sync.

---

### 7. No foreign key or index on `source_verification_jobs`

**File:** `services/explorer-api/migrations/0010_tiny_tombstone.sql`

The `source_verification_jobs` table has `contract_class_id` and `version` columns
but no foreign key referencing `l2_contract_class_registered`. Orphaned verification
jobs can persist after block reorgs cascade-delete the parent contract class.

---

### 8. Response status inconsistency in `POST_VERIFY_SOURCE`

**File:** `services/explorer-api/src/svcs/http-server/routes/controllers/source-verification.ts`

After publishing the Kafka message, the handler updates the job status to `COMPILING`
(line 166) then responds with `{ status: "PENDING" }` (line 188). Clients that
immediately poll will see `COMPILING`, not `PENDING`.
