---
name: git-release
description: Create consistent releases and changelogs for Chicmoz. Covers the multi-branch production model, Aztec version management per branch, semantic versioning, and gh release create commands.
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I Do

- Explain the Chicmoz branch and release model
- Help draft release notes from merged PRs since the last tag
- Propose the correct semantic version bump
- Generate a ready-to-paste `gh release create` command
- Guide bumping `@aztec/*` package versions across all affected branches

---

## Repository & Branch Structure

Chicmoz uses a **multi-track deployment model**. Each Aztec network runs from its own long-lived branch, and each branch can be on a **different Aztec version**:

```
main                  ← integration trunk (PRs land here)
  │
  ├── production            → Mainnet   (aztecscan.xyz)
  ├── production-testnet    → Testnet   (testnet.aztecscan.xyz)
  ├── production-devnet     → Devnet    (devnet.aztecscan.xyz)
  └── staging               → Staging  (testnet-flavoured, self-hosted runner)
```

### Current Aztec versions per branch (as of last update)

| Branch                | `@aztec/*` version | `aztecprotocol/aztec` Docker |
| --------------------- | ------------------ | ---------------------------- |
| `main` / `production` | `4.1.1`            | `aztecprotocol/aztec:4.1.1`  |
| `production-testnet`  | `4.1.1`            | `aztecprotocol/aztec:4.1.1`  |
| `production-devnet`   | `4.0.3`            | `aztecprotocol/aztec:4.0.3`  |

**Each branch independently tracks its own Aztec version.** Devnet often runs a different (sometimes older) version because it targets a different network node.

### Feature flow

```
feat/my-feature  →  PR to main  →  merge to main
                                          │
                                  Promote to production branches:
                                  git checkout production
                                  git merge main
                                  git push
                                  (repeat for production-testnet, production-devnet as needed)
```

Short-lived branch naming conventions:

- `feat/` or `feature/` — new features
- `fix/`, `bug/`, `hotfix/` — bug fixes
- `chore/` — maintenance (e.g., `chore/update-to-version-4-1-1` for Aztec bumps)
- `ui/` — frontend-only changes

---

## Versioning

Tags follow **`v{MAJOR}.{MINOR}.{PATCH}`** — applied only to `main`/`production`:

```
v1.11.0  v1.10.0  v1.9.0  v1.8.0  ...  v1.0.0
```

- `production-testnet` and `production-devnet` are **not separately tagged** — they deploy from their branch HEAD
- The version string is injected into Docker images at build time via `scripts/get_version.sh`:
  ```bash
  git describe --tags  # → "v1.11.0" on tag, "v1.11.0-42-gabc1234" ahead of tag
  ```
- This becomes `VITE_VERSION_STRING` in the `explorer-ui` build

### Bump rules

| Change type                                     | Bump    | Example               |
| ----------------------------------------------- | ------- | --------------------- |
| New features, UI additions, new endpoints       | `MINOR` | `v1.11.0` → `v1.12.0` |
| Bug fixes, hotfixes, dependency updates         | `PATCH` | `v1.11.0` → `v1.11.1` |
| Breaking API changes, major Aztec version jumps | `MAJOR` | `v1.x.x` → `v2.0.0`   |

---

## Release Checklist

### 1. Find PRs merged since the last tag

```bash
# Get the last tag
git describe --tags --abbrev=0

# List commits since last tag on main/production
git log v1.11.0..HEAD --oneline --merges

# Or list all commits (including non-merge)
git log v1.11.0..HEAD --oneline
```

### 2. Categorize and draft release notes

Group by type:

- **Features** (`feat/`, `feature/`, `ui/` branches or `feat:` commit prefixes)
- **Fixes** (`fix/`, `bug/`, `hotfix/` or `fix:` prefixes)
- **Chores / Maintenance** (`chore/` — Aztec upgrades, config changes, dependency bumps)

### 3. Determine the version bump and tag

```bash
# Create and push the tag
git tag v1.12.0
git push origin v1.12.0
```

### 4. Create the GitHub release

```bash
gh release create v1.12.0 \
  --title "v1.12.0" \
  --notes "## What's Changed

### Features
- feat: description (#PR)

### Fixes
- fix: description (#PR)

### Maintenance
- chore: description (#PR)

**Full Changelog**: https://github.com/aztec-scan/chicmoz/compare/v1.11.0...v1.12.0"
```

---

## Bumping Aztec Versions

When Aztec releases a new version, the upgrade must be applied to each branch independently. Use the `chore/update-to-version-X.X.X` branch naming convention.

### Files to update per branch

1. **Root `package.json` — `resolutions` field** (pins all `@aztec/*` transitively):

   ```json
   "resolutions": {
     "@aztec/aztec.js": "NEW_VERSION",
     "@aztec/stdlib": "NEW_VERSION",
     "@aztec/accounts": "NEW_VERSION",
     "@aztec/bb.js": "NEW_VERSION",
     "@aztec/bb-prover": "NEW_VERSION",
     "@aztec/builder": "NEW_VERSION",
     "@aztec/constants": "NEW_VERSION",
     "@aztec/entrypoints": "NEW_VERSION",
     "@aztec/ethereum": "NEW_VERSION",
     "@aztec/foundation": "NEW_VERSION",
     "@aztec/l1-artifacts": "NEW_VERSION",
     "@aztec/noir-contracts.js": "NEW_VERSION",
     "@aztec/protocol-contracts": "NEW_VERSION",
     "@aztec/pxe": "NEW_VERSION",
     "@aztec/simulator": "NEW_VERSION"
   }
   ```

2. **Per-service `package.json` files** that have direct `@aztec/*` deps:

   - `services/aztec-listener/package.json`
   - `services/ethereum-listener/package.json`
   - `services/explorer-api/package.json`
   - `services/event-cannon/package.json`

3. **`services/event-cannon/Dockerfile.compile-contracts`**:

   ```dockerfile
   FROM aztecprotocol/aztec:NEW_VERSION
   ```

   This Docker image version **must match** the npm package version exactly.

4. **Run `yarn install`** to regenerate `yarn.lock`

5. **Build and test**:
   ```bash
   yarn build:packages
   yarn build
   yarn test
   ```

### Branch strategy for Aztec upgrades

- Create `chore/update-to-version-X.X.X` from the **target branch** (e.g., `production-devnet` if only upgrading devnet)
- PR into the target branch, not necessarily into `main` if networks are on different versions
- After stabilization on devnet/testnet, promote the bump to `main` and eventually `production`

---

## When to Promote Changes Between Branches

Not every merge to `main` needs to go to all production branches — especially for Aztec version bumps:

| Scenario                           | Action                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| Bug fix (network-agnostic)         | Merge to `main`, then cherry-pick or merge to all production branches |
| New feature (no Aztec API changes) | Merge to `main`, promote to all production branches                   |
| Aztec version bump                 | Apply per branch individually — devnet may be on a different version  |
| Hotfix needed on devnet only       | Cherry-pick directly onto `production-devnet`                         |
