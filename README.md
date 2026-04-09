# pinboard-3

City of Philadelphia monorepo for map-based finder applications built with Vue 3.

## Structure

This is a **pnpm workspace monorepo** with two top-level directories:

### `packages/` — Shared libraries

Shared code that apps import. These are internal workspace packages, not published to npm.

| Package                           | Description                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@pinboard/core`](packages/core) | Shared utilities and data logic                                                                                                                       |
| [`@pinboard/ui`](packages/ui)     | Shared Vue component library — wraps PhilaUI components (`@phila/phila-ui-*`) and map-core (`@phila/phila-ui-map-core`) into a single import for apps |

### `apps/` — Deployable applications

Each app is a standalone Vue 3 application that imports from the shared packages.

| App                                               | Description                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| [`oem-flood-finder`](apps/oem-flood-finder)       | OEM flood monitoring — real-time gauge readings, flood cameras, and alerts |
| [`primary-care-finder`](apps/primary-care-finder) | Primary care facility finder                                               |

## Getting Started

Requires Node.js 20+ and pnpm.

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared packages (required before running any app)
cd packages/ui && pnpm build && cd ../..

# 3. Run an app dev server
pnpm dev:oem   # oem-flood-finder
pnpm dev:pc    # primary-care-finder
```

### Why you must build `packages/ui` first

Apps depend on the **built output** (`dist/`) of `packages/ui`, not its source files. If you skip the build step, you'll get missing module errors when starting an app.

You also need to rebuild `packages/ui` whenever you change its source code:

```bash
cd packages/ui && pnpm build
```

### FontAwesome Pro

Some dependencies require FontAwesome Pro icons. You need a `.npmrc` file (at the repo root or in your home directory) with your FA Pro auth token:

```
@fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=YOUR_TOKEN_HERE
```

Do not commit this file — it is gitignored.

## Tooling

- **pnpm** — package manager and workspace management
- **Turbo** — task orchestration (build, lint, type-check)
- **city CLI** — AWS infrastructure deployment (`city deploy`, `city ship`)
