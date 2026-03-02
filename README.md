# pinboard-3

City of Philadelphia monorepo for flood monitoring and related applications.

## Packages

| Package                           | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| [`@pinboard/core`](packages/core) | Shared utilities and data logic                 |
| [`@pinboard/ui`](packages/ui)     | Shared Vue component library (PhilaUI wrappers) |

## Apps

| App                                         | Description                  |
| ------------------------------------------- | ---------------------------- |
| [`oem-flood-finder`](apps/oem-flood-finder) | OEM flood finder static site |

## Getting Started

Requires Node.js 20+ and pnpm.

```bash
# Install dependencies
pnpm install

# Build all packages and apps
pnpm build

# Run oem-flood-finder dev server
pnpm dev:oem
```

## Tooling

- **pnpm** — package manager and workspace management
- **Turbo** — task orchestration (build, lint, type-check)
- **city CLI** — AWS infrastructure deployment (`city deploy`, `city ship`)
