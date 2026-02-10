# Pinboard-3 Monorepo Design

_Created: 2026-02-05_

## Overview

Pinboard-3 is a monorepo containing multiple single-page apps (5+) that share common code. When shared packages are updated, only affected apps rebuild and deploy.

## Technology Stack

- **Package manager:** pnpm with workspaces
- **Task orchestration:** Turbo
- **Framework:** Vue 3
- **Build tool:** Vite
- **Formatting:** Prettier

## Directory Structure

```
pinboard-3/
├── apps/                    # Deployable single-page apps
│   ├── recycling-finder/
│   ├── wifi-finder/
│   ├── farmers-markets/
│   └── ...
├── packages/                # Shared libraries
│   ├── core/               # Base utilities, types, config
│   ├── ui/                 # Shared Vue components
│   └── map/                # Map functionality
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Package Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│                      APPS                           │
│  recycling-finder, wifi-finder, farmers-markets...  │
└─────────────────────────────────────────────────────┘
                         │
            ┌────────────┼────────────┐
            ↓            ↓            ↓
        ┌──────┐    ┌────────┐    ┌──────┐
        │  ui  │───→│  map   │    │ ... │
        └──────┘    └────────┘    └──────┘
            │            │
            └─────┬──────┘
                  ↓
              ┌──────┐
              │ core │
              └──────┘
```

| Package  | Contents                                                               |
| -------- | ---------------------------------------------------------------------- |
| **core** | TypeScript types, shared utilities, API client helpers, config loaders |
| **ui**   | Vue 3 components (search bar, cards, filters, panels, loading states)  |
| **map**  | MapLibre integration, layer management, markers, popups, geolocation   |

## Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "format": {
      "cache": false
    },
    "format:check": {}
  }
}
```

### Root package.json scripts

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## App Structure

Each app in `apps/` follows this pattern:

```
apps/recycling-finder/
├── src/
│   ├── main.ts              # Vue app entry point
│   ├── App.vue              # Root component
│   ├── config.ts            # App-specific config
│   └── assets/              # App-specific images, icons
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

App package.json:

```json
{
  "name": "@pinboard/recycling-finder",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@pinboard/core": "workspace:*",
    "@pinboard/ui": "workspace:*",
    "@pinboard/map": "workspace:*",
    "vue": "^3.5.0"
  }
}
```

## Package Structure

Each package in `packages/` follows this pattern:

```
packages/core/
├── src/
│   ├── index.ts             # Public exports
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Utility functions
│   └── api/                 # API client helpers
├── package.json
├── vite.config.ts
└── tsconfig.json
```

Package package.json:

```json
{
  "name": "@pinboard/core",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  }
}
```

## Smart Deployment

Turbo's dependency graph enables smart deployment:

1. `"dependsOn": ["^build"]` ensures dependencies build first
2. Content hashing detects which packages actually changed
3. Only apps whose dependencies changed will rebuild

## Implementation Approach

Incremental setup:

1. **Root configuration** - package.json, pnpm-workspace.yaml, turbo.json, prettier, tsconfig.base.json
2. **packages/core** - foundation with no internal dependencies
3. **packages/ui** - depends on core
4. **packages/map** - depends on core
5. **First app** - use as template for others
6. **Remaining apps** - add incrementally, extracting common patterns to packages
