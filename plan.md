# Source verification failure feedback plan

I agree with the simplified approach.

Because the platform is open source, the most useful thing we can do is:

- classify roughly **where** the failure happened
- expose enough raw compiler output for the user to understand it and reproduce it locally

Instead of trying to fully translate every failure into a polished product message, we should focus on making the failure transparent.

## Proposed model

Add two new fields to source verification job results:

- `failureStage`
- `compileOutput`

### `failureStage`

This should be a small enum describing the broad stage that failed.

Suggested values:

- `INPUT_VALIDATION`
- `CLONE`
- `CHECKOUT`
- `COMPILE`
- `TRANSPILATION`
- `ARTIFACT_DISCOVERY`
- `ARTIFACT_VERIFICATION`
- `SOURCE_EXTRACTION`
- `TIMEOUT`
- `INTERNAL`

This gives the user a quick summary of what category of failure occurred, without trying to hide technical detail.

### `compileOutput`

This should contain the relevant raw compiler/orchestrator output for the failed job.

For example, in the reproduced failure case, this would include the important lines:

```txt
Selected artifact is not transpiled: /workspace/repo/target/token_contract-Token.json
Recompiling from workspace root (/workspace/repo) with --package token_contract to force postprocessing...
Transpiler doesn't know how to process getter "aztec_avm_address"
Error: bb exited with code null
```

This lets the user:

- see the actual failure
- search upstream issues
- reproduce locally with the same repo/ref/subpath/version
- understand whether the issue is likely their input, the compiler, or a platform bug

## Why this is better than over-abstracting

Trying to over-classify every failure into a user-facing sentence has downsides:

- it risks being wrong
- it hides the raw error that engineers actually need
- it adds ongoing maintenance as toolchain failures evolve

Since the system is open source, users who care enough to verify contracts are likely to benefit more from:

- a broad stage label
- the real output

than from a heavily simplified explanation.

## What should change

### 1. Persist `failureStage` and `compileOutput` on source verification jobs

Relevant files:

- `services/explorer-api/src/svcs/database/schema/l2contract/index.ts`
- `services/explorer-api/src/svcs/database/controllers/l2contract/source-verification.ts`
- `packages/types/src/aztec/l2Contract.ts`

Notes:

- add nullable DB columns for `failureStage` and `compileOutput`
- expose them via the shared Zod schema/types
- return them in `GET /verify-source/{jobId}`

### 2. Extend compiler result events to carry compile output

Relevant files:

- `packages/message-registry/src/aztec.ts`
- `packages/types/src/aztec/l2Contract.ts`
- `services/compiler-orchestrator/src/svcs/job-manager/index.ts`

Notes:

- extend `CompileSourceResultEvent` with optional `failureStage` and `compileOutput`
- when compilation fails, capture useful output and publish it
- include enough output to diagnose the failure, but avoid unbounded payloads
- likely cap stored output to a reasonable size

### 3. Improve failure-stage detection in compiler-orchestrator

Relevant file:

- `services/compiler-orchestrator/src/svcs/job-manager/index.ts`

Notes:

- map obvious failure points to a broad `failureStage`
- examples:
  - clone failure -> `CLONE`
  - checkout/pathspec failure -> `CHECKOUT`
  - no artifact found -> `ARTIFACT_DISCOVERY`
  - transpiler panic / artifact still not transpiled -> `TRANSPILATION`
  - generic compile failure -> `COMPILE`
  - timeout -> `TIMEOUT`

We do not need very fine-grained codes at first.

### 4. Persist failure info in explorer-api when compile results arrive

Relevant file:

- `services/explorer-api/src/events/received/on-compile-source-result.ts`

Notes:

- if compile result is not successful, write:

  - `status = FAILED`
  - `failureStage`
  - `compileOutput`
  - `error` (can stay as a short summary if useful)

- for verification failures after compilation succeeds, set:
  - `failureStage = ARTIFACT_VERIFICATION`
  - optionally also populate `compileOutput` if there is relevant output

### 5. Return `failureStage` and `compileOutput` from the job status endpoint

Relevant file:

- `services/explorer-api/src/svcs/http-server/routes/controllers/source-verification.ts`

Notes:

- add both fields to the OpenAPI response
- include them in the JSON returned by `GET_VERIFY_SOURCE_JOB`

### 6. Show raw failure details in the UI

Relevant file:

- `services/explorer-ui/src/components/verify-source-form/job-status.tsx`

Notes:

- display `failureStage` prominently in the failed state
- show `compileOutput` in a scrollable `<pre>` or expandable details section
- keep the current short error summary too if desired
- do not over-summarize the failure

Example UI structure:

- `Verification failed`
- `Stage: TRANSPILATION`
- short error line
- expandable `Compiler output`

### 7. Optionally show a local repro hint in the UI

Relevant files:

- `services/explorer-ui/src/components/verify-source-form/job-status.tsx`
- `services/explorer-ui/src/components/verify-source-form/index.tsx`

Potential content:

- repo URL
- git ref
- subpath
- aztec version

This helps users reproduce locally using the same inputs.

## Recommended implementation order

1. Add DB/schema/type support for `failureStage` and `compileOutput`
2. Extend compiler result event payloads
3. Capture and publish compile output from compiler-orchestrator
4. Persist and return the new fields in explorer-api
5. Update the verify-source UI to display them

## Important design constraint

`compileOutput` should be bounded.

We should not store arbitrarily large logs in the database or Kafka messages.

Suggested approach:

- keep only the final relevant section of output
- or cap to a fixed maximum size, for example last 16-64 KB
- prefer preserving the failure lines over the full successful compile logs

## Example for the reproduced failure

For the `aztec-standards` repro we just ran, the job would ideally surface:

- `failureStage: TRANSPILATION`
- `error: Compilation failed during transpilation`
- `compileOutput:`

```txt
Selected artifact is not transpiled: /workspace/repo/target/token_contract-Token.json
Recompiling from workspace root (/workspace/repo) with --package token_contract to force postprocessing...
Postprocessing contracts...
Transpiling: target/token_contract-Token.json -> target/token_contract-Token.json
thread '<unnamed>' panicked at src/transpile.rs:962:14:
Transpiler doesn't know how to process getter "aztec_avm_address"
Error: bb exited with code null
```

That should be enough for an advanced user to understand what happened and reproduce it.
