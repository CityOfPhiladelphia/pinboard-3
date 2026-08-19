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

Do not commit this file — it is gitignored.

## Branch strategy

```
feature/* → test → main
```

| Branch | Environment | Trigger        |
| ------ | ----------- | -------------- |
| `test` | Test        | Push to `test` |
| `main` | Production  | Push to `main` |

Feature branches should be opened as PRs against `test`. Once changes are validated in the test environment, open a PR from `test` → `main` to promote to production. Both branches are protected and require a passing CI check before merging.

## CI / deployment

On push to `test` or `main`, the pipeline:

1. Lints, type-checks, and builds all packages
2. Detects which apps changed (by file path — `apps/<name>/`, `packages/`, or `ci.yml`)
3. Deploys only the affected apps to the appropriate environment using `city ship`

Deployments use AWS OIDC — no long-lived credentials. Each app/environment pair has its own IAM role scoped to its S3 bucket and CloudFront distribution.

## Tooling

- **pnpm** — package manager and workspace management
- **Turbo** — task orchestration (build, lint, type-check)
- **city CLI** — AWS infrastructure deployment (`city deploy`, `city ship`)

### Icons

The Phila UI design system uses bundled SVG icons sourced from [Font Awesome Free](https://fontawesome.com) (CC BY 4.0). All icons are embedded directly in the package — no external icon font or auth token required.
