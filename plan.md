# Plan: Verified Contract Source Code UI

## Goal

Add a **Source Code** tab to the Contract Class Details page that allows users to:

1. **View** verified source code (Noir files) with syntax highlighting and file tree navigation
2. **Submit** source verification requests by providing a GitHub repository URL
3. **Monitor** verification job progress in real-time (PENDING → COMPILING → VERIFYING → VERIFIED / FAILED)

## Context

### What already exists

| Layer                     | Exists? | Details                                                                                    |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| **Backend API endpoints** | ✅      | `POST /verify-source`, `GET /verify-source/:jobId`, `GET /source` on explorer-api          |
| **Kafka event flow**      | ✅      | `COMPILE_SOURCE_REQUEST_EVENT` → compiler service → `COMPILE_SOURCE_RESULT_EVENT`          |
| **DB schema**             | ✅      | `sourceVerificationJobs` table, `sourceCode` JSONB on `l2ContractClassRegistered`          |
| **Types (shared pkg)**    | ✅      | `sourceVerificationJobSchema`, `sourceCodeEntrySchema`, `compileSourceRequestSchema`, etc. |
| **UI: API client**        | ❌      | No methods in `src/api/` for source verification endpoints                                 |
| **UI: React Query hooks** | ❌      | No hooks for source code fetching or verification submission                               |
| **UI: Service constants** | ❌      | No URL helpers for `/verify-source` or `/source` endpoints                                 |
| **UI: Source Code tab**   | ❌      | No tab or components for source code display                                               |
| **UI: Verification form** | ❌      | No form to submit GitHub URL for verification                                              |

### API Endpoints to consume

| Method | Path                                                                   | Purpose                                                                               |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `GET`  | `/l2/contract-classes/:classId/versions/:version/source`               | Get verified source code (returns `{ sourceCodeUrl, sourceCode: [{path, content}] }`) |
| `POST` | `/l2/contract-classes/:classId/versions/:version/verify-source`        | Submit verification request (body: `{ githubUrl, gitRef?, subPath?, aztecVersion? }`) |
| `GET`  | `/l2/contract-classes/:classId/versions/:version/verify-source/:jobId` | Poll job status                                                                       |

### Data types (from `@chicmoz-pkg/types`)

```typescript
// Source code entry (file in the verified repo)
type SourceCodeEntry = { path: string; content: string };

// Verification job status
type SourceVerificationStatus =
  | "PENDING"
  | "COMPILING"
  | "VERIFYING"
  | "VERIFIED"
  | "FAILED";

// Full job record
type SourceVerificationJob = {
  id: string; // UUID
  contractClassId: string;
  version: number;
  githubUrl: string;
  gitRef?: string;
  subPath?: string;
  aztecVersion: string;
  status: SourceVerificationStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

---

## Implementation Plan

### Phase 1: API & Data Layer

**1.1 Add URL constants** — `src/service/constants.ts`

- Add `getL2ContractClassSource(classId, version)` → `/l2/contract-classes/${classId}/versions/${version}/source`
- Add `postL2VerifySource(classId, version)` → `/l2/contract-classes/${classId}/versions/${version}/verify-source`
- Add `getL2VerifySourceJob(classId, version, jobId)` → `/l2/contract-classes/${classId}/versions/${version}/verify-source/${jobId}`

**1.2 Add API methods** — `src/api/contract.ts` (extend `ContractL2API`)

- `getContractClassSource({ classId, version })` → returns `{ sourceCodeUrl, sourceCode: SourceCodeEntry[] }`
- `postVerifySource({ classId, version, githubUrl, gitRef?, subPath?, aztecVersion? })` → returns `{ jobId, status }`
- `getVerifySourceJob({ classId, version, jobId })` → returns `SourceVerificationJob`

**1.3 Add React Query hooks** — `src/hooks/api/contract.ts` (extend existing)

- `useContractClassSource(classId, version)` — enabled only when source is known to be available
- `useVerifySourceJob(classId, version, jobId)` — polling hook (refetch every 3s while status is PENDING/COMPILING/VERIFYING)
- Add query keys to `queryKeyGenerator` in `src/hooks/api/utils.ts`

**1.4 Add mutation hook** — `src/hooks/api/contract.ts`

- `useSubmitSourceVerification(classId, version)` — TanStack `useMutation` wrapping `postVerifySource`

---

### Phase 2: Source Code Viewer Component

**2.1 Create `src/components/source-code-viewer/` directory**

Files:

- `index.tsx` — main component orchestrating file tree + code display
- `file-tree.tsx` — collapsible tree sidebar for navigating source files
- `code-display.tsx` — syntax-highlighted code panel with line numbers
- `types.ts` — local types (tree node structure, etc.)

**2.2 Component: `SourceCodeViewer`** (`index.tsx`)

- Props: `sourceFiles: SourceCodeEntry[]`, `sourceCodeUrl?: string`
- Layout: side-by-side (file tree on left, code on right) on desktop; stacked on mobile
- Uses `<FileTree>` + `<CodeDisplay>` internally
- Shows a GitHub link badge to `sourceCodeUrl` at the top

**2.3 Component: `FileTree`** (`file-tree.tsx`)

- Converts flat `SourceCodeEntry[]` (paths like `src/main.nr`, `src/lib/utils.nr`) into a tree structure
- Renders with collapsible folders (Radix Collapsible or custom)
- Highlights the currently-selected file
- Uses folder/file icons (Lucide: `FolderIcon`, `FileIcon`, `FileCodeIcon`)

**2.4 Component: `CodeDisplay`** (`code-display.tsx`)

- Renders the selected file's content with line numbers
- Syntax highlighting for `.nr` (Noir) files — use a lightweight approach:
  - Option A: `react-syntax-highlighter` with a Rust-like grammar (Noir is Rust-like)
  - Option B: Simple pre-formatted display with line numbers + manual keyword highlighting via CSS
  - **Recommended: Option A** — add `react-syntax-highlighter` as a dependency
- Shows file path as a breadcrumb header
- Includes a "Copy" button (reuse existing `<CopyableJson>` pattern or `<CopyText>`)

---

### Phase 3: Verify Source Form Component

**3.1 Create `src/components/verify-source-form/` directory**

Files:

- `index.tsx` — the verification submission form
- `job-status.tsx` — real-time job status display

**3.2 Component: `VerifySourceForm`** (`index.tsx`)

- Props: `classId: string`, `version: string`, `onSuccess?: () => void`
- Fields:
  - GitHub URL (required, validated pattern: `https://github.com/<owner>/<repo>`)
  - Git ref (optional, placeholder: "main")
  - Sub-path (optional, placeholder: "contracts/token")
  - Aztec version (optional, default: "4.0.3")
- Submit button triggers `useSubmitSourceVerification` mutation
- On success, transitions to `<JobStatus>` display
- Uses existing shadcn `<Input>`, `<Button>`, `<Separator>` components
- Error handling: shows toast via Sonner for 429 (rate limit) and other errors

**3.3 Component: `JobStatus`** (`job-status.tsx`)

- Props: `classId: string`, `version: string`, `jobId: string`
- Polls `useVerifySourceJob` every 3 seconds
- Shows a step progress indicator: PENDING → COMPILING → VERIFYING → VERIFIED ✓ / FAILED ✗
- On VERIFIED: calls `onSuccess` callback (triggers refetch of source code)
- On FAILED: shows error message from job + retry button

---

### Phase 4: Integration into Contract Class Details Page

**4.1 Add "Source Code" tab** — `src/pages/contract-class-details/constants.ts`

- Add `"sourceCode"` to `tabId` union type and `tabIds` array
- Add `{ id: "sourceCode", label: "Source Code" }` to `contractClassTabs`

**4.2 Update `tabs-section.tsx`**

- Import new `SourceCodeTab` component
- Add `sourceCode` case to `renderTabContent()` switch
- Add `sourceCode` availability check in `isOptionAvailable` (available when `sourceCodeUrl` is set OR as a fallback form)

**4.3 Create `src/pages/contract-class-details/tabs/source-code-tab.tsx`**

- Smart tab component that handles both states:
  - **Verified**: Fetches source via `useContractClassSource` → renders `<SourceCodeViewer>`
  - **Not verified**: Renders `<VerifySourceForm>` with explanatory text
  - **Verification in progress**: Renders `<JobStatus>` (if user just submitted)

---

### Phase 5: Visual Enhancements

**5.1 Verification badge in key-value display** — `key-value-helpers.tsx`

- Enhance the existing `SOURCE CODE URL` row:
  - If verified: show green "✓ Verified" badge + GitHub link
  - If not verified: show "Submit for Verification" link that navigates to the Source Code tab

**5.2 Verified indicator on contracts list** — `src/components/contracts/classes/columns.tsx`

- Add a small verified checkmark icon in the contract classes table for classes with `sourceCodeUrl` set

---

## File Change Summary

### New files

| File                                                        | Purpose                               |
| ----------------------------------------------------------- | ------------------------------------- |
| `src/components/source-code-viewer/index.tsx`               | Main source code viewer component     |
| `src/components/source-code-viewer/file-tree.tsx`           | File tree sidebar                     |
| `src/components/source-code-viewer/code-display.tsx`        | Code display with syntax highlighting |
| `src/components/source-code-viewer/types.ts`                | Tree node types                       |
| `src/components/verify-source-form/index.tsx`               | Source verification submission form   |
| `src/components/verify-source-form/job-status.tsx`          | Real-time job status tracker          |
| `src/pages/contract-class-details/tabs/source-code-tab.tsx` | Tab wrapper (verified view vs form)   |

### Modified files

| File                                                     | Changes                            |
| -------------------------------------------------------- | ---------------------------------- |
| `src/service/constants.ts`                               | Add 3 new URL helpers              |
| `src/api/contract.ts`                                    | Add 3 new API methods              |
| `src/hooks/api/contract.ts`                              | Add 3 new hooks (query + mutation) |
| `src/hooks/api/utils.ts`                                 | Add 3 new query key generators     |
| `src/pages/contract-class-details/constants.ts`          | Add `sourceCode` tab ID            |
| `src/pages/contract-class-details/tabs-section.tsx`      | Wire up Source Code tab rendering  |
| `src/pages/contract-class-details/key-value-helpers.tsx` | Enhance source code URL display    |
| `src/components/contracts/classes/columns.tsx`           | Add verified indicator column      |

### New dependency

| Package                           | Reason                                   |
| --------------------------------- | ---------------------------------------- |
| `react-syntax-highlighter`        | Syntax highlighting for Noir source code |
| `@types/react-syntax-highlighter` | TypeScript types                         |

---

## Recommended Implementation Order

```
Phase 1 (API layer)           ~1 hour
  └─ 1.1 URL constants
  └─ 1.2 API methods
  └─ 1.3 Query hooks
  └─ 1.4 Mutation hook

Phase 2 (Source viewer)       ~2-3 hours
  └─ 2.1 Component directory
  └─ 2.2 SourceCodeViewer
  └─ 2.3 FileTree
  └─ 2.4 CodeDisplay

Phase 3 (Verify form)         ~1-2 hours
  └─ 3.1 Component directory
  └─ 3.2 VerifySourceForm
  └─ 3.3 JobStatus

Phase 4 (Integration)         ~1 hour
  └─ 4.1 Tab config
  └─ 4.2 Tabs section wiring
  └─ 4.3 Source code tab

Phase 5 (Polish)              ~1 hour
  └─ 5.1 Verification badge
  └─ 5.2 List indicator
```

**Total estimate: ~6-8 hours**

---

## Design Decisions & Notes

1. **Source Code tab is always visible** — if source isn't verified, the tab shows the verification form instead. This makes the verify flow discoverable.
2. **Noir syntax highlighting** — use Rust grammar from `react-syntax-highlighter` as Noir's syntax is Rust-derived. Can customize keyword list later.
3. **Polling vs WebSocket** — job status uses polling (3s interval) since WebSocket is available but verification is infrequent and short-lived. Polling is simpler.
4. **No new routes** — everything lives within the existing contract class details page via tabs. No new TanStack Router routes needed.
5. **Dark mode** — all new components must support dark mode using existing Tailwind CSS variables and `dark:` prefixes.
6. **Mobile responsive** — file tree collapses to a dropdown/accordion on narrow screens.
