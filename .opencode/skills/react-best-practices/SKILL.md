---
name: react-best-practices
description: React best practices for the Chicmoz explorer-ui (React + Vite + TanStack Router/Query + shadcn/ui). Use when writing, reviewing, or refactoring frontend code — components, hooks, data fetching, WebSocket handling, or performance optimisation.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: frontend
---

# React Best Practices — Chicmoz `explorer-ui`

Guidelines for writing and reviewing frontend code in `services/explorer-ui/`. This is a **pure client-side React SPA** (Vite + React 18) — there is no Next.js, no RSC, no SSR, no server actions. All guidance below is scoped to what actually runs in this project.

## Stack at a Glance

| Concern           | Library / Pattern                                            |
| ----------------- | ------------------------------------------------------------ |
| Routing           | TanStack Router v1 — file-based, lazy routes                 |
| Server state      | TanStack Query v5 (`useQuery`, `useQueries`)                 |
| HTTP client       | Axios singleton (`src/api/client.ts`)                        |
| Schema validation | Zod — every API response is parsed before entering the cache |
| UI primitives     | shadcn/ui (Radix + Tailwind)                                 |
| Styling           | Tailwind CSS 3 + `cn()` (`clsx` + `tailwind-merge`)          |
| Tables            | TanStack Table v8 — generic `DataTable<TData, TValue>`       |
| Real-time         | Singleton native `WebSocket` + React Query cache writes      |
| Charts            | Recharts                                                     |
| Theme             | `next-themes`                                                |
| TypeScript        | Strict TS 5, path alias `~/ → src/`                          |

---

## 1. Project Structure Conventions

```
src/
  api/          # Raw Axios calls + Zod validation — NO React here
  hooks/api/    # useQuery wrappers — one file per domain
  hooks/websocket/  # Singleton WS connection + cache callbacks
  hooks/        # Utility hooks (useTabVisibility, useTimeTick…)
  components/   # Presentational components
    ui/         # shadcn/ui primitives — do not modify Radix defaults arbitrarily
  pages/        # Smart, data-connected page components
  routes/       # TanStack Router file-based routes — thin wrappers only
  providers/    # QueryClient, RouterProvider, ThemeProvider
  service/      # Constants: API URL, WS URL, env var parsing
  lib/          # Pure utilities: cn(), formatters
  types.ts      # Project-wide TS types/enums
```

**Rules:**

- `src/api/` must stay React-free. API functions are plain async functions that call `client` and run `validateResponse`.
- Route files in `src/routes/` are thin wrappers — import the page component and nothing else.
- Page components in `src/pages/` are the only place that calls hooks and assembles layouts.
- `src/components/` components must not call `useQuery` directly — data comes via props from pages.
- Use the `~/` path alias for all cross-directory imports. Never use `../../../` chains.

---

## 2. Data Fetching — TanStack Query

### Always use `queryKeyGenerator`

All query keys live in `src/hooks/api/utils.ts` via the `queryKeyGenerator` factory. Never write inline array keys.

```ts
// Bad
useQuery({ queryKey: ["blocks", height], queryFn: ... })

// Good
useQuery({ queryKey: queryKeyGenerator.blockByHeight(height), queryFn: ... })
```

### Hook structure — one file per domain

```ts
// src/hooks/api/block.ts
export const useGetBlock = (
  height: string,
): UseQueryResult<ChicmozL2Block, Error> =>
  useQuery({
    queryKey: queryKeyGenerator.blockByHeight(height),
    queryFn: () => BlockAPI.getBlockByHeight(height),
  });
```

- Always declare the explicit return type `UseQueryResult<T, Error>`.
- Put all query-related constants (`staleTime`, `refetchInterval`) in the hook, not in the component.
- Use `REFETCH_INTERVAL` from `utils.ts` for live data; do not hardcode `1000`.

### Parallel queries

Use `useQueries` for fan-out patterns (e.g. fetching multiple block heights):

```ts
const results = useQueries({
  queries: heights.map((h) => ({
    queryKey: queryKeyGenerator.blockByHeight(String(h)),
    queryFn: () => BlockAPI.getBlockByHeight(String(h)),
  })),
});
```

### Pagination

Use `placeholderData: (prev) => prev` on paginated queries to avoid loading flicker between pages. Compute `from`/`to` offsets from the latest height + page index — do not pass raw page numbers to the server.

### Disabled queries

Disable queries by default when the trigger is user-driven (e.g. search). Use `enabled: false` + call `refetch()` in the event handler:

```ts
const { refetch } = useQuery({
  queryKey: queryKeyGenerator.blockByHeight(heightOrHash),
  queryFn: () => BlockAPI.getBlockByHeight(heightOrHash),
  enabled: false,
});
// in handler:
await refetch();
```

---

## 3. API Layer

### Always validate with Zod

Every API function must call `validateResponse` from `src/api/client.ts`:

```ts
export const getBlock = async (height: number): Promise<ChicmozL2Block> => {
  const res = await client.get(`/blocks/${height}`);
  return validateResponse(chicmozL2BlockSchema, res.data);
};
```

Never return `res.data` directly. Schema violations will throw a typed `ApiError` that React Query will expose as `error`.

### Axios client

Use the module-level `client` singleton from `src/api/client.ts`. Never create new `axios` instances inside components or hooks.

---

## 4. WebSocket / Real-Time

There is exactly **one WebSocket connection** for the app, initialised in `src/providers/router-provider.tsx` via `useWebSocketConnection()`. Do not create additional WS connections.

### Writing into the cache

Real-time updates bypass the network by calling `queryClient.setQueryData(...)` directly in `src/hooks/websocket/message-callbacks.ts`:

```ts
// Good — instant update, no re-fetch
queryClient.setQueryData(queryKeyGenerator.latestBlock, block);

// For lists that need invalidation (e.g. stats):
queryClient.invalidateQueries({ queryKey: queryKeyGenerator.stats });
```

### Tab visibility

Always gate expensive polling or WS reconnection behind `useTabVisibility`. The WS hook already does this — do not duplicate the logic in individual components.

### Reorg detection

When updating the block list from WS, check for reorgs by comparing the incoming block height to the current max. If the incoming height is lower, call `invalidateQueries` rather than optimistically appending.

---

## 5. Components

### shadcn/ui primitives

All low-level UI lives in `src/components/ui/`. These are Radix + Tailwind components.

- Do not reach for raw HTML (`<button>`, `<select>`, `<dialog>`) when a `ui/` primitive exists.
- Compose via the variant pattern using `class-variance-authority` (`cva`) and `cn()`.
- Never override Radix ARIA attributes — they are set correctly by default.

### `cn()` for all class strings

```ts
// Always
<div className={cn("base-class", condition && "conditional-class", className)} />

// Never
<div className={`base-class ${condition ? "conditional-class" : ""}`} />
```

### `DataTable` for all list views

Reuse `src/components/data-table/DataTable.tsx`. Column definitions live in a separate `*-columns.tsx` file next to the domain component. Never build ad-hoc tables with raw `<table>` elements.

```ts
// Block table columns
// src/components/blocks/block-table-columns.tsx
export const blockTableColumns: ColumnDef<UiBlockTable>[] = [ ... ];
```

### `KeyValueDisplay` for detail pages

All entity detail pages (block, tx, contract) must use `KeyValueDisplay` + `DetailItem[]` from `src/components/info-display/`. Do not build bespoke key/value layouts.

### `LoadingDetails` for loading/error states

All detail pages must render `<LoadingDetails />` while `isLoading` is true or when `error` is present. Do not render blank screens or custom spinners at the page level.

### No inline component definitions

Never define a component inside another component's render function — it gets recreated on every render and breaks memoisation.

```ts
// Bad
const MyPage = () => {
  const Row = ({ item }) => <div>{item.name}</div>; // recreated every render
  return <Row item={data} />;
};

// Good — define Row at module level or in its own file
const Row: FC<{ item: Item }> = ({ item }) => <div>{item.name}</div>;
const MyPage = () => <Row item={data} />;
```

### Conditional rendering

Use ternary, not `&&`, when the falsy branch could render `0`:

```ts
// Bad — renders "0" when count is 0
{count && <Badge>{count}</Badge>}

// Good
{count ? <Badge>{count}</Badge> : null}
```

---

## 6. Routing

### Lazy routes everywhere

Every route must use `createLazyFileRoute` (`.lazy.tsx` file). Only the root layout (`__root.tsx`) uses `createRootRoute`.

```ts
// src/routes/blocks/$blockNumber.lazy.tsx
export const Route = createLazyFileRoute("/blocks/$blockNumber")({
  component: BlockDetails,
});
```

### Type-safe navigation

Always use the `routes` constant from `__root.tsx` or the typed `<Link to="...">` from TanStack Router. Never hardcode URL strings in `href` attributes or `navigate()` calls.

### Route files are thin wrappers

Route files must only import the page component and call `createLazyFileRoute`. No data fetching, no state, no JSX beyond the route config itself.

---

## 7. Re-render Optimisation

### Derive state during render — not in effects

```ts
// Bad
const [isExpanded, setIsExpanded] = useState(false);
useEffect(() => {
  setIsExpanded(data?.count > 0);
}, [data]);

// Good
const isExpanded = (data?.count ?? 0) > 0;
```

### Primitive dependencies in effects

Destructure to primitives before using in `useEffect`/`useCallback` dependency arrays:

```ts
// Bad — object reference changes every render
useEffect(() => { ... }, [block]);

// Good
const { height, hash } = block ?? {};
useEffect(() => { ... }, [height, hash]);
```

### Use refs for transient high-frequency values

Values updated more often than renders (e.g. animation frame timestamps, scroll positions) belong in `useRef`, not `useState`:

```ts
const lastUpdateRef = useRef<number>(Date.now());
```

### `useMemo` for expensive derivations or stable references

Apply `useMemo` when:

1. The computation is genuinely expensive (not simple property access).
2. The result is a non-primitive passed as a prop to a memoised component.

Do not wrap simple string/number derivations in `useMemo`.

### `startTransition` for non-urgent UI updates

Wrap low-priority state updates (e.g. filter/search input affecting a large table) in `startTransition` to keep the input responsive:

```ts
startTransition(() => setFilter(value));
```

---

## 8. TypeScript Conventions

### Explicit return types on hooks

Always annotate query hook return types:

```ts
export const useLatestBlock = (): UseQueryResult<ChicmozL2BlockLight, Error> => ...
```

### `type` imports

Use the `type` keyword for type-only imports:

```ts
import { type FC, type ReactNode } from "react";
import { type ChicmozL2Block } from "@chicmoz-pkg/types";
```

### Props interfaces

Define a named `Props` interface (or `type Props`) above every component. Do not inline prop types in the function signature for anything beyond trivially simple components.

```ts
interface Props {
  block: ChicmozL2BlockLight;
  isLoading: boolean;
}

const BlockRow: FC<Props> = ({ block, isLoading }) => { ... };
```

### No `any`

Do not use `as any` or `: any`. If a Zod schema covers the data, use `z.infer<typeof schema>`. If a third-party type is unavailable, use `unknown` and narrow with a type guard.

### Domain types come from `@chicmoz-pkg/types`

All L2 block, transaction, contract, and L1 types are defined in the shared workspace package. Do not redefine them locally in `explorer-ui`.

---

## 9. Bundle Size

### Lazy-load all routes

Every page is already behind `createLazyFileRoute`. Keep it that way — do not convert lazy routes to eager ones.

### Direct imports — avoid barrel re-exports

Import directly from the source module, not through a barrel `index.ts` when the barrel pulls in heavy transitive deps:

```ts
// Prefer
import { Button } from "~/components/ui/button";

// Over
import { Button } from "~/components/ui"; // if ui/index.ts re-exports everything
```

### Dynamic import for dev-only tooling

Dev tools (e.g. TanStack Router Devtools) must stay behind a `React.lazy()` + environment guard so they are tree-shaken from production builds:

```ts
const Devtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/router-devtools").then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null;
```

---

## 10. Styling

- Use Tailwind utility classes directly. Avoid writing custom CSS unless there is no Tailwind equivalent.
- Use `cn()` from `~/lib/utils` for all dynamic class merging.
- Keep component-specific style variants in `cva(...)` blocks — not scattered `cn()` calls across JSX.
- `BaseLayout` (`src/layout/base-layout.tsx`) provides the max-width centering wrapper. Wrap every page's root element in `<BaseLayout>`.
- Dark mode is handled by `next-themes` + Tailwind's `dark:` prefix. Never check `document.documentElement.classList` manually.
