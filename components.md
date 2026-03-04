# Component Specifications: Verified Contract Source Code UI

## Component Tree

```
ContractClassDetails (existing page)
└── TabSection (existing)
    └── SourceCodeTab (new)
        ├── [verified]   → SourceCodeViewer
        │                   ├── FileTree
        │                   └── CodeDisplay
        ├── [unverified] → VerifySourceForm
        └── [verifying]  → JobStatus
```

---

## 1. `<SourceCodeTab>` — Smart Tab Wrapper

**Location:** `src/pages/contract-class-details/tabs/source-code-tab.tsx`

**Props:**

```typescript
type SourceCodeTabProps = {
  contractClassId: string;
  version: string;
  sourceCodeUrl: string | null | undefined;
};
```

**Behavior:**

- If `sourceCodeUrl` is set → fetch source via `useContractClassSource` → render `<SourceCodeViewer>`
- If `sourceCodeUrl` is not set → render `<VerifySourceForm>`
- After successful verification submission → render `<JobStatus>`, then transition to viewer on VERIFIED

**States:**

```
┌─────────────┐     submit     ┌────────────┐    verified    ┌───────────────────┐
│ VerifySource │ ──────────► │  JobStatus  │ ──────────► │ SourceCodeViewer  │
│    Form      │               │  (polling)  │               │   (fetch + show)  │
└─────────────┘               └────────────┘               └───────────────────┘
                                    │ failed
                                    ▼
                              ┌────────────┐
                              │ Error +    │
                              │ Retry btn  │
                              └────────────┘
```

---

## 2. `<SourceCodeViewer>` — File Browser + Code Display

**Location:** `src/components/source-code-viewer/index.tsx`

**Props:**

```typescript
type SourceCodeViewerProps = {
  sourceFiles: SourceCodeEntry[]; // from @chicmoz-pkg/types
  sourceCodeUrl?: string; // GitHub URL
};
```

**Layout (desktop):**

```
┌──────────────────────────────────────────────────────────┐
│  📂 Source Code  ·  Verified from github.com/...  [↗]    │ ← header with GitHub link
├──────────────┬───────────────────────────────────────────┤
│ 📁 src/      │  src/main.nr                    [Copy]   │
│   📄 main.nr │  ─────────────────────────────────────── │
│   📁 lib/    │  1 │ mod lib;                            │
│     📄 u...  │  2 │ use dep::aztec::prelude::*;         │
│              │  3 │                                      │
│ 📄 Nargo...  │  4 │ #[aztec]                            │
│              │  5 │ contract Token {                     │
│              │  6 │   ...                                │
│              │  ...                                      │
├──────────────┴───────────────────────────────────────────┤
│  7 files · Verified 2026-02-15                           │ ← footer stats
└──────────────────────────────────────────────────────────┘
```

**Layout (mobile):**

```
┌────────────────────────────────────┐
│ 📂 Source Code · Verified  [↗]     │
├────────────────────────────────────┤
│ ▾ Select file...             [v]  │  ← dropdown instead of sidebar
├────────────────────────────────────┤
│ src/main.nr              [Copy]   │
│ ────────────────────────────────  │
│ 1 │ mod lib;                      │
│ 2 │ use dep::aztec::...           │
│ ...                               │
└────────────────────────────────────┘
```

---

## 3. `<FileTree>` — Directory Navigation

**Location:** `src/components/source-code-viewer/file-tree.tsx`

**Props:**

```typescript
type FileTreeProps = {
  files: SourceCodeEntry[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
};
```

**Behavior:**

- Converts flat path list to nested tree structure
- Folders are collapsible (default: first level expanded)
- Clicking a file selects it → updates parent state → `<CodeDisplay>` shows content
- Selected file is highlighted (purple accent, matching Aztec theme)
- Files sorted: folders first, then alphabetical
- Icons: `FolderOpen` / `Folder` for dirs, `FileCode` for `.nr`, `File` for others (Lucide)

**Tree node type:**

```typescript
type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
};
```

**Helper:** `buildFileTree(files: SourceCodeEntry[]) → TreeNode[]`

- Located in `src/components/source-code-viewer/types.ts`

---

## 4. `<CodeDisplay>` — Syntax Highlighted Source

**Location:** `src/components/source-code-viewer/code-display.tsx`

**Props:**

```typescript
type CodeDisplayProps = {
  filePath: string;
  content: string;
};
```

**Behavior:**

- Header: file path as breadcrumb + Copy button
- Body: syntax-highlighted code with line numbers
- Use `react-syntax-highlighter` with `Prism` and `rust` language (closest to Noir)
- Theme: `oneDark` for dark mode, `oneLight` for light mode
- Line numbers enabled, matching font: `Space Mono` (existing project font)
- Scrollable in both axes for long files / long lines
- Empty state: "Select a file to view its source code"

**Styling integration:**

```css
/* Match existing card style */
.code-display {
  @apply bg-white dark:bg-gray-900 rounded-lg border;
  font-family: "Space Mono", monospace;
}
```

---

## 5. `<VerifySourceForm>` — Submission Form

**Location:** `src/components/verify-source-form/index.tsx`

**Props:**

```typescript
type VerifySourceFormProps = {
  contractClassId: string;
  version: string;
  onJobCreated: (jobId: string) => void;
};
```

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  🔍 Verify Source Code                                    │
│                                                           │
│  Source code has not been verified for this contract       │
│  class. Submit a GitHub repository to verify.             │
│                                                           │
│  GitHub URL *                                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │ https://github.com/owner/repo                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Git Ref                          Sub-path                │
│  ┌─────────────────────────┐     ┌─────────────────────┐ │
│  │ main                    │     │ contracts/token      │ │
│  └─────────────────────────┘     └─────────────────────┘ │
│                                                           │
│  Aztec Version                                            │
│  ┌─────────────────────────┐                             │
│  │ 4.0.3                   │                             │
│  └─────────────────────────┘                             │
│                                                           │
│                              [ Verify Source Code ]       │
└──────────────────────────────────────────────────────────┘
```

**Validation:**

- GitHub URL: required, must match `https://github.com/<owner>/<repo>` pattern
- Git ref: optional string
- Sub-path: optional string
- Aztec version: defaults to "4.0.3"

**Error states:**

- 429: "Too many requests. Please try again later." (toast)
- 404: "Contract class not found." (toast)
- 200 with message: "Source code already verified" → navigate to viewer
- Network error: generic error toast

---

## 6. `<JobStatus>` — Verification Progress

**Location:** `src/components/verify-source-form/job-status.tsx`

**Props:**

```typescript
type JobStatusProps = {
  contractClassId: string;
  version: string;
  jobId: string;
  onVerified: () => void;
  onRetry: () => void;
};
```

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  ⏳ Verifying Source Code                                 │
│                                                           │
│  ● PENDING  ──  ○ COMPILING  ──  ○ VERIFYING  ──  ○ DONE │
│                                                           │
│  Status: Waiting for compilation to start...              │
│  Job ID: a1b2c3d4-...                                    │
│  Submitted: 2 minutes ago                                 │
└──────────────────────────────────────────────────────────┘
```

**Verified state:**

```
┌──────────────────────────────────────────────────────────┐
│  ✅ Source Code Verified                                  │
│                                                           │
│  ● PENDING  ──  ● COMPILING  ──  ● VERIFYING  ──  ● DONE│
│                                                           │
│  Source code has been verified successfully!               │
│                                   [ View Source Code ]    │
└──────────────────────────────────────────────────────────┘
```

**Failed state:**

```
┌──────────────────────────────────────────────────────────┐
│  ❌ Verification Failed                                   │
│                                                           │
│  ● PENDING  ──  ● COMPILING  ──  ✗ FAILED                │
│                                                           │
│  Error: Compiled bytecode does not match on-chain data.   │
│                                                           │
│                                       [ Try Again ]       │
└──────────────────────────────────────────────────────────┘
```

**Polling logic:**

- Uses `useVerifySourceJob(classId, version, jobId)` with `refetchInterval: 3000`
- Stops polling when status is `VERIFIED` or `FAILED`
- On `VERIFIED`: calls `onVerified()` (parent invalidates source query + shows viewer)
- On `FAILED`: shows error + retry button → calls `onRetry()` (parent shows form again)

---

## Shared Utilities

### Query keys to add (`src/hooks/api/utils.ts`)

```typescript
contractClassSource: (classId: string, version: string) =>
  ["contractClassSource", classId, version],
verifySourceJob: (classId: string, version: string, jobId: string) =>
  ["verifySourceJob", classId, version, jobId],
```

### URL constants to add (`src/service/constants.ts`)

```typescript
getL2ContractClassSource: (classId: string, version: string) =>
  `/l2/contract-classes/${classId}/versions/${version}/source`,
postL2VerifySource: (classId: string, version: string) =>
  `/l2/contract-classes/${classId}/versions/${version}/verify-source`,
getL2VerifySourceJob: (classId: string, version: string, jobId: string) =>
  `/l2/contract-classes/${classId}/versions/${version}/verify-source/${jobId}`,
```

---

## Styling Tokens

All new components should use these existing design tokens:

| Token                                     | Usage                 |
| ----------------------------------------- | --------------------- |
| `bg-white dark:bg-gray-900`               | Card backgrounds      |
| `rounded-lg shadow-md`                    | Card containers       |
| `text-purple-dark` / `var(--purple-dark)` | Aztec accent color    |
| `Space Mono`                              | Monospace font (code) |
| `Space Grotesk`                           | Headings              |
| `Inter`                                   | Body text             |
| `p-4`                                     | Standard card padding |
| `gap-4`                                   | Standard spacing      |

## Accessibility

- File tree: keyboard navigable (arrow keys, Enter to select)
- Code display: proper `<pre>` / `<code>` semantics
- Form: proper labels, aria-required on GitHub URL
- Job status: `aria-live="polite"` for status updates
- Color contrast: all text meets WCAG AA on both light/dark themes
