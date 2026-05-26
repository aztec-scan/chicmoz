# @chicmoz/explorer-ui-v2

Second-generation Aztec-Scan explorer UI — implements the **v2.1 terminal-
forward** redesign (Space Grotesk + Space Mono, purple-on-dark, dense data
grids) against the existing chicmoz API.

## Stack

- React 18 + Vite 5
- TanStack Router (file-based routing, lazy-loaded pages)
- TanStack Query (data fetching against the chicmoz REST API)
- Plain CSS with custom-property design tokens (`src/styles/tokens.css`,
  `shared.css`, `pages.css`). Tailwind is present but is only used for the
  small number of utilities in the reset layer; the design system lives in
  the CSS files.

## Project structure

```
src/
├── api/              REST clients (one file per API concern)
├── assets/           Brand logos
├── components/
│   ├── common/       Reusable display components (status pill, pagination…)
│   └── layout/       TopBar, Shell, ConsoleHead, brand logo
├── hooks/
│   ├── api/          React Query hooks wrapping `api/*`
│   └── websocket/    WS listener that invalidates query caches
├── lib/              Small utils: cn, status mapping, formatters
├── pages/            One folder per route (landing, blocks, tx-detail…)
├── providers/        Query, Theme, TanstackRouter
├── routes/           File-based route definitions (lazy)
├── service/          `constants.ts` — API endpoints + env vars
├── styles/           Global CSS (tokens, shared atoms, page styles)
├── main.tsx          App entry
└── vite-env.d.ts     Vite env typings
```

## Scripts

- `yarn dev` — start Vite dev server
- `yarn dev:green-favicon` — start Vite dev server with an opt-in green local favicon
- `yarn build` — type-check (`tsc -b`) + production build
- `yarn lint` — ESLint
- `yarn preview` — serve the production build locally

## Pages

| Route                                      | Design file                              | Page module               |
| ------------------------------------------ | ---------------------------------------- | ------------------------- |
| `/`                                        | `v2.1/Aztec-Scan Landing.html`           | `pages/landing`           |
| `/blocks`                                  | `v2.1/Aztec-Scan Blocks.html`            | `pages/blocks`            |
| `/blocks/$blockNumber`                     | `v2.1/Aztec-Scan Block Detail.html`      | `pages/block-detail`      |
| `/tx-effects`                              | `v2.1/Aztec-Scan Txs.html`               | `pages/txs`               |
| `/tx-effects/$hash`                        | `v2.1/Aztec-Scan Tx Detail.html`         | `pages/tx-detail`         |
| `/contracts`                               | `v2.1/Aztec-Scan Contracts.html`         | `pages/contracts`         |
| `/contracts/classes/$id/versions/$version` | `v2.1/Aztec-Scan Contract Class.html`    | `pages/contract-class`    |
| `/contracts/instances/$address`            | `v2.1/Aztec-Scan Contract Instance.html` | `pages/contract-instance` |
| `/validators`                              | `v2.1/Aztec-Scan Validators.html`        | `pages/validators`        |
| `/validators/$attesterAddress`             | `v2.1/Aztec-Scan Validator Detail.html`  | `pages/validator-detail`  |
| `/health`                                  | `v2.1/Aztec-Scan Health.html`            | `pages/health`            |

## Known gaps

See [`API_GAPS.md`](./API_GAPS.md) for a list of design fields that aren't
backed by the current chicmoz API, and the shortcuts this UI takes in each
case.
