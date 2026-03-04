# Work Log: Verified Contract Source Code UI

## Status: 🟢 Implementation Complete

---

### 2026-03-04 — Implementation

**Phase 1: API & Data Layer** ✅

- [x] Added 3 URL constants to `src/service/constants.ts`:
  - `getL2ContractClassSource(classId, version)`
  - `postL2VerifySource(classId, version)`
  - `getL2VerifySourceJob(classId, version, jobId)`
- [x] Added 3 API methods to `src/api/contract.ts`:
  - `getContractClassSource()` with response schema validation
  - `postVerifySource()` for submitting verification requests
  - `getVerifySourceJob()` for polling job status
- [x] Added response schemas: `contractClassSourceResponseSchema`, `verifySourceResponseSchema`
- [x] Added 2 query key generators to `src/hooks/api/utils.ts`:
  - `contractClassSource(classId, version)`
  - `verifySourceJob(classId, version, jobId)`
- [x] Added 3 React Query hooks to `src/hooks/api/contract.ts`:
  - `useContractClassSource()` — query with `enabled` flag
  - `useVerifySourceJob()` — polling hook (3s interval while status is PENDING/COMPILING/VERIFYING)
  - `useSubmitSourceVerification()` — `useMutation` for POST

**Phase 2: Source Code Viewer Component** ✅

- [x] Created `src/components/source-code-viewer/types.ts` — TreeNode, props types
- [x] Created `src/components/source-code-viewer/file-tree.tsx`:
  - `buildFileTree()` converts flat paths → hierarchical tree nodes
  - `FileTree` renders collapsible folders with icons (Lucide)
  - Sorts: folders first, then files, alphabetical
  - Highlights selected file
- [x] Created `src/components/source-code-viewer/code-display.tsx`:
  - Syntax highlighting via `react-syntax-highlighter` (Prism + oneDark theme)
  - Language detection: `.nr` → Rust, `.toml`, `.json`, `.md`
  - Copy button with toast feedback
  - Line numbers
- [x] Created `src/components/source-code-viewer/index.tsx`:
  - Side-by-side layout (file tree + code display) on desktop
  - Stacked on mobile
  - Green "Verified" badge + GitHub link at top
- [x] Added `react-syntax-highlighter` + `@types/react-syntax-highlighter` dependencies

**Phase 3: Verify Source Form + Job Status** ✅

- [x] Created `src/components/verify-source-form/index.tsx`:
  - Fields: GitHub URL (required, validated), Git ref, Sub-path, Aztec version
  - Form validation with toast errors
  - Uses `useSubmitSourceVerification` mutation
  - Transitions to `<JobStatus>` on successful submission
  - Error handling for 429 rate limit
- [x] Created `src/components/verify-source-form/job-status.tsx`:
  - Step progress indicator: PENDING → COMPILING → VERIFYING → VERIFIED
  - Visual states: animated spinner for active step, green check for complete
  - FAILED state: red banner with error message + retry button
  - VERIFIED state: green success banner
  - Polls via `useVerifySourceJob` (3s interval)

**Phase 4: Integration into Contract Class Details** ✅

- [x] Added `"sourceCode"` tab ID to `constants.ts`
- [x] Created `src/pages/contract-class-details/tabs/source-code-tab.tsx`:
  - Shows `<SourceCodeViewer>` when source is verified
  - Shows `<VerifySourceForm>` when not verified
  - Invalidates queries on successful verification
- [x] Updated `tabs-section.tsx`:
  - Imported `SourceCodeTab`
  - Added `sourceCode: true` to `isOptionAvailable` (always visible)
  - Added `sourceCode` case to `renderTabContent()`

**Phase 5: Visual Enhancements** ✅

- [x] Enhanced SOURCE CODE row in `key-value-helpers.tsx`:
  - Verified: green badge + "View source" link
  - Not verified: "Not verified" text
- [x] Added verified indicator column in `columns.tsx`:
  - Green checkmark icon with tooltip for verified classes
  - Added `sourceCodeUrl` to contract class schema

---

### 2026-03-04 — Initial Planning

**Done:**

- [x] Explored full codebase architecture (routing, API layer, hooks, components, pages)
- [x] Mapped all existing contract-related files (routes, pages, API, hooks, components)
- [x] Read explorer-api source verification controllers and endpoints
- [x] Read `@chicmoz-pkg/types` source verification schemas
- [x] Read `@chicmoz-pkg/contract-verification` package
- [x] Documented backend API contract (3 endpoints: GET source, POST verify, GET job)
- [x] Created comprehensive implementation plan (`plan.md`)
- [x] Created component specification (`components.md`)

**Discovered:**

- Backend is fully implemented: endpoints, Kafka flow, DB schema, compiler integration
- UI has zero support for source verification — fresh implementation needed
- `sourceCodeUrl` field already displayed as a link in contract class key-value section
- Existing `JsonViewer` and `CopyableJson` components can be partially reused
- `SourceCodeEntry` type (`{ path, content }`) is the data shape for source files

**Decisions made:**

- Source Code tab goes in Contract Class Details page (alongside existing tabs)
- Tab is always visible (shows form when unverified, shows code when verified)
- Use `react-syntax-highlighter` with Rust grammar for Noir files
- Use polling (3s) for job status — simpler than WebSocket for infrequent operations
- No new routes needed — everything in existing contract class details route

---

## File Change Summary

### New files (7)

| File                                                        | Purpose                          |
| ----------------------------------------------------------- | -------------------------------- |
| `src/components/source-code-viewer/types.ts`                | Tree node & component prop types |
| `src/components/source-code-viewer/file-tree.tsx`           | Collapsible file tree sidebar    |
| `src/components/source-code-viewer/code-display.tsx`        | Syntax-highlighted code panel    |
| `src/components/source-code-viewer/index.tsx`               | Main source code viewer          |
| `src/components/verify-source-form/index.tsx`               | Verification submission form     |
| `src/components/verify-source-form/job-status.tsx`          | Real-time job status tracker     |
| `src/pages/contract-class-details/tabs/source-code-tab.tsx` | Tab wrapper (viewer or form)     |

### Modified files (6)

| File                                                     | Changes                                |
| -------------------------------------------------------- | -------------------------------------- |
| `src/service/constants.ts`                               | 3 new URL helpers                      |
| `src/api/contract.ts`                                    | 3 new API methods + 2 response schemas |
| `src/hooks/api/contract.ts`                              | 3 new hooks (2 queries + 1 mutation)   |
| `src/hooks/api/utils.ts`                                 | 2 new query key generators             |
| `src/pages/contract-class-details/constants.ts`          | Added `sourceCode` tab                 |
| `src/pages/contract-class-details/tabs-section.tsx`      | Wired up Source Code tab               |
| `src/pages/contract-class-details/key-value-helpers.tsx` | Enhanced source code display           |
| `src/components/contracts/classes/columns.tsx`           | Verified indicator column              |
| `src/components/contracts/classes/schema.ts`             | Added `sourceCodeUrl` field            |

### New dependency

| Package                           | Reason                                 |
| --------------------------------- | -------------------------------------- |
| `react-syntax-highlighter`        | Syntax highlighting for Noir/Rust code |
| `@types/react-syntax-highlighter` | TypeScript types                       |
