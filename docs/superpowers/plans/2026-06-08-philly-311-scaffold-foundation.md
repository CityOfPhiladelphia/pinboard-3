# Philly 311 — Increment 1: Scaffold + Foundation Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status: IMPLEMENTED** on branch `feat/philly-311-scaffold`. All 7 tasks complete; 200 tests green; `turbo run build/type-check/test:run` green with no oem/pc/ui regressions. See "Implementation notes" at the bottom for deviations from this plan as written.

**Goal:** Stand up `apps/philly-311` in the pinboard-3 monorepo on its native conventions (Vite 7, vue-router 5, `@repo/*` configs, `@pinboard/ui`) and port the framework-light foundation (data/types/utils/composables/store/router/auth) across with its tests green.

**Architecture:** Fresh-scaffold an app cloned from the `oem-flood-finder` template, then copy the keep-worthy, UI-agnostic modules from the POC at `311-mobile-app/web/webportal/frontend/src` verbatim (adjusting only import paths + formatting), re-homing routing onto vue-router 5. The app boots inside a minimal `PinboardShell`; no redesign UI in this increment.

**Tech Stack:** Vue 3.5, vue-router 5, Pinia, Vite 7, Vitest (jsdom), `@phila/sso-vue` + `@azure/msal-browser`, maplibre-gl, `@pinboard/ui` (workspace), pnpm + turbo.

**Spec:** `docs/superpowers/specs/2026-06-08-philly-311-scaffold-foundation-design.md`

**Conventions for every task:**
- All paths below are relative to the pinboard-3 repo root unless absolute.
- `SRC` = `/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src` (the POC source being ported FROM). Read-only reference; never modify it.
- `APP` = `apps/philly-311/frontend` (the new app).
- Work happens on branch `feat/philly-311-scaffold` (already created).
- After copying any file, run `pnpm --filter @pinboard/philly-311 format` (prettier, `semi: false`) so style matches the monorepo. Tests are behavior, not formatting — reformatting never changes a passing test.
- "Copy verbatim" means: copy file contents unchanged except (a) prettier reformat, (b) import-path rewrites that are purely mechanical (e.g. none expected — the POC already uses the `@/` alias which we preserve).

---

## Task 1: Scaffold the app skeleton (installs + boots)

**Files:**
- Create: `apps/philly-311/city.config.json`
- Create: `apps/philly-311/frontend/package.json`
- Create: `apps/philly-311/frontend/tsconfig.json`
- Create: `apps/philly-311/frontend/eslint.config.mjs`
- Create: `apps/philly-311/frontend/vite.config.ts`
- Create: `apps/philly-311/frontend/vitest.config.ts`
- Create: `apps/philly-311/frontend/env.d.ts`
- Create: `apps/philly-311/frontend/index.html`
- Create: `apps/philly-311/frontend/.gitignore` (copy from `apps/oem-flood-finder/frontend/.gitignore`)
- Create: `apps/philly-311/frontend/.editorconfig` (copy from oem)
- Create: `apps/philly-311/frontend/.prettierrc.json` (copy from oem)
- Create: `apps/philly-311/frontend/.vscode/extensions.json` (copy from oem)
- Create: `apps/philly-311/frontend/.env.development` / `.env.test` / `.env.production` (copy from `SRC/../.env.*`)
- Create: `apps/philly-311/frontend/public/favicon.ico` (copy from `SRC/../public/favicon.ico`)
- Create: `apps/philly-311/frontend/src/main.ts`
- Create: `apps/philly-311/frontend/src/App.vue`
- Create: `apps/philly-311/frontend/src/pages/LandingPage.vue`
- Create: `apps/philly-311/frontend/src/router/index.ts` (minimal — guards added in Task 6)
- Create: `apps/philly-311/frontend/src/__test__/setup.ts` (copy from `SRC/__test__/setup.ts` verbatim)
- Create: `apps/philly-311/frontend/src/_smoke.test.ts` (copy from `SRC/_smoke.test.ts` verbatim)

- [ ] **Step 1: Create `city.config.json`**

```json
{
  "appName": "philly-311",
  "applicationType": "static-site",
  "department": "4-oit",
  "team": "Software Engineering",
  "contact": "websupport@phila.gov",
  "compliance": [],
  "confidentiality": "medium",
  "packageManager": "pnpm"
}
```
> Note: `cdkPath`/`environments` from the POC are intentionally omitted — CDK is a later increment.

- [ ] **Step 2: Create `frontend/package.json`**

```json
{
  "name": "@pinboard/philly-311",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "run-p type-check \"build-only {@}\" --",
    "preview": "vite preview",
    "build-only": "vite build",
    "type-check": "vue-tsc --build",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@azure/msal-browser": "^5.9.0",
    "@phila/phila-ui-app-footer": "1.2.3-beta.3",
    "@phila/phila-ui-app-header": "0.3.0-beta.9",
    "@phila/phila-ui-button": "2.2.3-beta.3",
    "@phila/phila-ui-checkbox": "0.1.1-beta.3",
    "@phila/phila-ui-collapse-panel": "0.1.1-beta.2",
    "@phila/phila-ui-core": "2.4.0-beta.2",
    "@phila/phila-ui-link": "1.0.4-beta.2",
    "@phila/phila-ui-radio": "0.1.1-beta.2",
    "@phila/phila-ui-search": "1.1.3-beta.3",
    "@phila/phila-ui-text-field": "1.1.3-beta.3",
    "@phila/sso-vue": "^0.0.9",
    "@pinboard/ui": "workspace:*",
    "dompurify": "^3.4.1",
    "maplibre-gl": "^5.24.0",
    "pinia": "^2.3.1",
    "vue": "^3.5.33",
    "vue-router": "^5.0.6"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/dompurify": "^3.2.0",
    "@vitejs/plugin-vue": "^6.0.3",
    "@vue/eslint-config-typescript": "^14.6.0",
    "@vue/test-utils": "^2.4.9",
    "@vue/tsconfig": "^0.8.1",
    "jsdom": "^29.1.0",
    "npm-run-all2": "^8.0.4",
    "prettier": "3.8.1",
    "typescript": "^6.0.3",
    "vite": "^7.3.1",
    "vite-plugin-vue-devtools": "^8.0.5",
    "vitest": "^4.1.5",
    "vue-tsc": "^3.2.6"
  }
}
```
> Decisions baked in: vue-router `^5`, vite `^7`, Vue `^3.5.33` (match the template, not the POC's 8/4). `@phila/phila-ui-*` pinned to the same betas `@pinboard/ui` consumes to avoid two copies in the tree. Only the phila-ui packages the foundation + boot shell actually need are listed; the wizard's extras (date-field, textarea, select-field, switch, modal, callout, breadcrumbs, nav-link, input-form, map-core) are added when the wizard ports. **Watch-item:** `src/__test__/setup.ts` (ported in Step 17) `vi.mock`s `@phila/phila-ui-map-core`, `-app-header`, `-app-footer`, `-text-field`, `-textarea`, `-select-field`, `-radio`, `-checkbox`, `-switch`, `-date-field`. `vi.mock` with a factory does not require the package to be installed, but if any foundation test imports one transitively and it's absent, add it. Verify in Task 4.

- [ ] **Step 3: Create `frontend/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/vite.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue", "vite.config.ts", "vitest.config.ts"],
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"],
      "@pinboard/ui": ["../../../packages/ui/src/index.ts"]
    }
  }
}
```
> `noUncheckedIndexedAccess` preserves the strictness the POC compiled under.

- [ ] **Step 4: Create `frontend/eslint.config.mjs`**

```js
import { viteJsConfig } from '@repo/eslint-config/base.js'

/** @type {import("eslint").Linter.Config[]} */
export default viteJsConfig
```

- [ ] **Step 5: Create `frontend/vite.config.ts`**

```ts
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@pinboard/ui/style.css': fileURLToPath(
        new URL('../../../packages/ui/dist/ui.css', import.meta.url),
      ),
      '@pinboard/ui': fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
    },
  },
  server: {
    // Proxy /api to the deployed test stage so local dev avoids the CORS
    // preflight 403 (API Gateway requires the API key even on OPTIONS).
    proxy: {
      '/api': {
        target: 'https://yw32n3h725.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/test'),
      },
    },
  },
})
```
> The POC's per-package `@phila/.../dist/index.css` alias hack is intentionally dropped — Increment 1 renders no phila components directly.

- [ ] **Step 6: Create `frontend/vitest.config.ts`**

```ts
// ABOUTME: Vitest config for the philly-311 frontend.
// ABOUTME: jsdom env, Vue plugin, '@' alias, and a CSS-stub plugin so tests can
// ABOUTME: mount components whose dist files import side-effect CSS.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const cssStub: Plugin = {
  name: 'vitest-css-stub',
  enforce: 'pre',
  resolveId(id) {
    if (id.endsWith('.css')) return '\0vitest-css-stub'
  },
  load(id) {
    if (id === '\0vitest-css-stub') return 'export default {};'
  },
}

export default defineConfig({
  plugins: [cssStub, vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    conditions: ['import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__test__/setup.ts'],
    css: false,
  },
})
```
> The POC's `deps.optimizer`/`deps.web` transform block (for real `@phila/*` CSS) is omitted — foundation tests mock phila-ui via `setup.ts` and never load real phila CSS. Re-add when the wizard ports.

- [ ] **Step 7: Create `frontend/env.d.ts`**

```ts
// ABOUTME: Vite env var type declarations for philly-311.
// ABOUTME: Declares the VITE_SSO_*, VITE_API_*, VITE_AIS_* names.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SSO_CLIENT_ID: string
  readonly VITE_SSO_TENANT: string
  readonly VITE_SSO_AUTHORITY_DOMAIN: string
  readonly VITE_SSO_REDIRECT_URI: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_AIS_BASE_URL: string
  readonly VITE_AIS_AUTOCOMPLETE_BASE_URL: string
  readonly VITE_AIS_GATEKEEPER_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```
> The POC's stale `VITE_CARTO_BASE_URL` (unused since the carto config was dropped) is omitted.

- [ ] **Step 8: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,500,1,0&display=swap"
    />
    <title>Philly 311</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 9: Copy ancillary template + asset files**

```bash
OEM=apps/oem-flood-finder/frontend
APP=apps/philly-311/frontend
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend
cp "$OEM/.gitignore" "$APP/.gitignore"
cp "$OEM/.editorconfig" "$APP/.editorconfig"
cp "$OEM/.prettierrc.json" "$APP/.prettierrc.json"
mkdir -p "$APP/.vscode" && cp "$OEM/.vscode/extensions.json" "$APP/.vscode/extensions.json"
cp "$SRC/../.env.development" "$APP/.env.development"
cp "$SRC/../.env.test" "$APP/.env.test"
cp "$SRC/../.env.production" "$APP/.env.production"
mkdir -p "$APP/public" && cp "$SRC/../public/favicon.ico" "$APP/public/favicon.ico"
mkdir -p "$APP/src/__test__"
cp "$SRC/__test__/setup.ts" "$APP/src/__test__/setup.ts"
cp "$SRC/_smoke.test.ts" "$APP/src/_smoke.test.ts"
```
> Note: `SRC/__test__/empty-css.js` exists in the POC but is dead (unreferenced — the inline `cssStub` plugin in `vitest.config.ts` replaced it). It is intentionally NOT copied; don't treat its absence as a miss.

- [ ] **Step 10: Create `frontend/src/router/index.ts` (minimal)**

```ts
// ABOUTME: Vue Router setup for philly-311.
// ABOUTME: Increment 1 routes only; auth + wizard guards are added in Task 6.
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/pages/LandingPage.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

export default router
```

- [ ] **Step 11: Create `frontend/src/pages/LandingPage.vue` (placeholder)**

```vue
<!-- ABOUTME: Increment-1 landing placeholder. Replaced by the Pinboard map+list
     finder in Increment 2. -->
<script setup lang="ts"></script>

<template>
  <section class="landing-placeholder">
    <h1>Philly 311</h1>
    <p>Reports nearby — coming soon.</p>
  </section>
</template>

<style scoped>
.landing-placeholder {
  padding: var(--spacing-l, 2rem);
}
</style>
```

- [ ] **Step 12: Create `frontend/src/App.vue` (PinboardShell skeleton)**

```vue
<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome.
     Increment-1 skeleton — landing content arrives in Increment 2. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import '@pinboard/ui/style.css'
</script>

<template>
  <PinboardShell
    title="Philly 311"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Philly 311',
      href: '/',
    }"
  >
    <RouterView />
  </PinboardShell>
</template>
```
> Cross-check `PinboardShell`'s required props against `packages/ui/src/components/PinboardShell.vue` before finalizing; it requires `title` and accepts an optional `logo`. If `createPinboard` (the plugin) is required for `PinboardShell` to render, add it in `main.ts` Step 13 mirroring `apps/oem-flood-finder/frontend/src/main.ts`.

- [ ] **Step 13: Create `frontend/src/main.ts`**

```ts
// ABOUTME: App entry point: install Pinia, sso-vue plugin, Router, then mount.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createB2CPlugin } from '@phila/sso-vue'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(createB2CPlugin())
app.use(router)
app.use(
  createPinboard({
    title: 'Philly 311',
    map: {
      center: [-75.1652, 39.9526],
      zoom: 11,
      mobile: { zoom: 9.5 },
    },
  }),
)
app.mount('#app')
```
> The POC imported three local CSS files (`tokens.css`, `layout.css`, `phila-ui.css`) + map-core CSS. Those are dropped — `@pinboard/ui/style.css` (imported in `App.vue`) supplies the design system. If `createPinboard` is not actually required by `PinboardShell`, drop the `app.use(createPinboard(...))` block (confirm against the oem app).

- [ ] **Step 14: Install from the repo root**

Run: `pnpm install`
Expected: resolves with `@pinboard/philly-311` added; no peer-dependency errors. (Requires `NPM_FONTAWESOME_SECRET` in the environment for the full-workspace install.)

- [ ] **Step 15: Build `@pinboard/ui` so the workspace import + style.css resolve**

Run: `pnpm --filter @pinboard/ui build`
Expected: produces `packages/ui/dist/ui.css` and `dist/index.js` (the vite alias for `@pinboard/ui/style.css` points at `dist/ui.css`).

- [ ] **Step 16: Verify type-check, smoke test, build, and boot**

Run: `pnpm --filter @pinboard/philly-311 type-check`
Expected: PASS (no errors).

Run: `pnpm --filter @pinboard/philly-311 test:run`
Expected: PASS — `_smoke.test.ts` green. (`setup.ts` is loaded but its phila-ui mocks are inert until a test imports them.)

Run: `pnpm --filter @pinboard/philly-311 build`
Expected: PASS — emits `dist/`.

Run: `pnpm --filter @pinboard/philly-311 dev` then open the served URL.
Expected: app mounts, `PinboardShell` chrome (311 header/footer) renders with the landing placeholder. Stop the dev server.

- [ ] **Step 17: Format + commit**

```bash
pnpm --filter @pinboard/philly-311 format
git add apps/philly-311
git commit -m "feat(philly-311): scaffold app skeleton on monorepo conventions

Boots in PinboardShell with a landing placeholder. Vite 7, vue-router 5,
Pinia, sso-vue, @pinboard/ui workspace dep. Source POC: webportal @ 54b43e1."
```

---

## Task 2: Port types + data

**Files:**
- Create: `APP/src/types/api.ts`, `APP/src/types/wizard.ts` (copy verbatim from `SRC/types/`)
- Create: `APP/src/data/service_types.json`, `service_type_questions.json`, `common_categories.json` (copy verbatim from `SRC/data/`)

- [ ] **Step 1: Copy the files**

```bash
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src
APP=apps/philly-311/frontend/src
mkdir -p "$APP/types" "$APP/data"
cp "$SRC/types/api.ts" "$SRC/types/wizard.ts" "$APP/types/"
cp "$SRC/data/service_types.json" "$SRC/data/service_type_questions.json" "$SRC/data/common_categories.json" "$APP/data/"
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @pinboard/philly-311 type-check`
Expected: PASS. (Types + JSON have no external coupling beyond each other.)

- [ ] **Step 3: Format + commit**

```bash
pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/types apps/philly-311/frontend/src/data
git commit -m "feat(philly-311): port api/wizard types + service-type data"
```

---

## Task 3: Port utils + tests

**Files (copy verbatim from `SRC/utils/`):**
- `bounds.ts` (+ `bounds.test.ts`), `conditional.ts` (+ test), `distance.ts`, `fuzzy.ts` (+ test), `mapTiles.ts`, `photo.ts` (+ test), `sanitize.ts` (+ test), `serviceTypeMeta.ts` (+ test)

- [ ] **Step 1: Copy the directory**

```bash
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src
APP=apps/philly-311/frontend/src
mkdir -p "$APP/utils"
cp "$SRC/utils/"*.ts "$APP/utils/"
```

- [ ] **Step 2: Run the util tests — expect green**

Run: `pnpm --filter @pinboard/philly-311 test:run -- src/utils`
Expected: PASS — all 6 util test files green (`bounds`, `conditional`, `fuzzy`, `photo`, `sanitize`, `serviceTypeMeta`).
> If any test fails, STOP and investigate per the spec — a behavioral failure is a regression, not something to edit away.

- [ ] **Step 3: Type-check, format, commit**

```bash
pnpm --filter @pinboard/philly-311 type-check
pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/utils
git commit -m "feat(philly-311): port utils (fuzzy/distance/bounds/photo/sanitize/...) + tests"
```

---

## Task 4: Port composables + tests

**Files (copy verbatim from `SRC/composables/`):**
- `api311.ts` (+ test), `useAis.ts` (+ test), `useApi.ts` (+ test), `useApiError.ts` (+ test), `useDebouncedSearch.ts` (+ test), `useGeolocation.ts` (+ test), `useKnowledgeArticles.ts` (+ test), `useMapBounds.ts`, `useNearbyReports.ts` (+ test), `useServiceTypes.ts` (+ test), `useWizardValidity.ts` (+ test)

- [ ] **Step 1: Copy the directory**

```bash
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src
APP=apps/philly-311/frontend/src
mkdir -p "$APP/composables"
cp "$SRC/composables/"*.ts "$APP/composables/"
```

- [ ] **Step 2: Run the composable tests — expect green**

Run: `pnpm --filter @pinboard/philly-311 test:run -- src/composables`
Expected: PASS — all 10 composable test files green. These exercise `@/utils`, `@/types`, `@/data`, and `@phila/sso-vue` (mocked via `setup.ts`).
> Watch-item from the spec: `api311.ts`, `useApi.ts`, `useKnowledgeArticles.ts` import `useAuth` from `@phila/sso-vue`. `setup.ts` provides the fallback mock, so no per-test wiring is needed. If a test that declares its own `vi.mock('@phila/sso-vue', ...)` fails, compare its expectations against `SRC` — it must match the POC exactly.
> If a phila-ui package referenced only by a `setup.ts` `vi.mock` factory causes a resolution error, add it to `package.json` dependencies (it's already pinned-beta in the monorepo) and re-run.

- [ ] **Step 3: Type-check, format, commit**

```bash
pnpm --filter @pinboard/philly-311 type-check
pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/composables
git commit -m "feat(philly-311): port composables (api311/useApi/useAis/...) + tests"
```

---

## Task 5: Port the wizard store

**Files:**
- Create: `APP/src/stores/reportSubmission.ts` (+ `reportSubmission.test.ts`) — copy verbatim from `SRC/stores/`

- [ ] **Step 1: Copy**

```bash
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src
APP=apps/philly-311/frontend/src
mkdir -p "$APP/stores"
cp "$SRC/stores/reportSubmission.ts" "$SRC/stores/reportSubmission.test.ts" "$APP/stores/"
```

- [ ] **Step 2: Run the store test — expect green**

Run: `pnpm --filter @pinboard/philly-311 test:run -- src/stores`
Expected: PASS — `reportSubmission.test.ts` green (Pinia store, no router/auth coupling).

- [ ] **Step 3: Type-check, format, commit**

```bash
pnpm --filter @pinboard/philly-311 type-check
pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/stores
git commit -m "feat(philly-311): port reportSubmission Pinia store + test"
```

---

## Task 6: Router on vue-router 5 — guards, auth redirect, guard tests

**Files:**
- Modify: `APP/src/router/index.ts` (add `authGuard`, `wizardGuard`, `/auth/redirect` route, wire guards)
- Create: `APP/src/pages/AuthRedirectPage.vue` (+ `AuthRedirectPage.test.ts`) — copy verbatim from `SRC/pages/`, verify self-contained
- Create: `APP/src/router/wizardGuard.test.ts` — copy verbatim from `SRC/router/wizardGuard.test.ts`
- Create: `APP/src/router/router.guards.test.ts` — ported **adapted** (stub protected route)

Reference: read `SRC/router/index.ts`, `SRC/router/wizardGuard.test.ts`, `SRC/router/router.guards.test.ts`, and `SRC/pages/AuthRedirectPage.vue` + `.test.ts` first.

- [ ] **Step 1: Copy `AuthRedirectPage.vue` + its test; confirm coupling**

```bash
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src
APP=apps/philly-311/frontend/src
cp "$SRC/pages/AuthRedirectPage.vue" "$SRC/pages/AuthRedirectPage.test.ts" "$APP/pages/"
```
Read the copied `AuthRedirectPage.vue`: it must only depend on `@phila/sso-vue` + `vue-router` (no deferred-page imports). If it imports a deferred page/store path, STOP and note it.

- [ ] **Step 2: Replace `router/index.ts` with the full Increment-1 router**

```ts
// ABOUTME: Vue Router setup for philly-311.
// ABOUTME: Increment-1 route table; auth guard (sso-vue) + wizard guard (store).
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type NavigationGuard,
  type RouteLocationNormalized,
} from 'vue-router'
import { watch } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

export const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/pages/LandingPage.vue') },
  { path: '/auth/redirect', component: () => import('@/pages/AuthRedirectPage.vue') },
]

// Exported so tests can attach it to a memory router without reimplementing the logic.
export const authGuard: NavigationGuard = async (to) => {
  if (!to.meta.requiresAuth) return true
  const auth = useAuth()
  if (!auth.authReady.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        auth.authReady,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        },
        { immediate: true },
      )
    })
  }
  if (auth.isAuthenticated.value) return true
  sessionStorage.setItem('auth:redirectTo', to.fullPath)
  auth.signIn()
  return false
}

// Exported so tests can attach it to a memory router without going through the singleton.
export function wizardGuard(to: RouteLocationNormalized): true | string {
  if (to.path === '/report' || !to.path.startsWith('/report/')) return true
  const store = useReportSubmissionStore()

  if (typeof to.query.category === 'string' && to.query.category !== store.category) {
    store.setCategory(to.query.category)
  }
  const lat = Number(to.query.lat)
  const lng = Number(to.query.lng)
  if (
    typeof to.query.lat === 'string' &&
    typeof to.query.lng === 'string' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    !store.location
  ) {
    store.setLocation({ address: '', lat, lng })
  }

  if (store.isEmpty) return '/report'
  return true
}

const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach(authGuard)
router.beforeEach(wizardGuard)

export default router
```
> This is the POC's guard logic verbatim, with the route table trimmed to Increment-1 paths. `wizardGuard` is inert until `/report/*` routes exist, and `authGuard` is inert until a `requiresAuth` route exists — both are present and tested now so they don't regress later. Verify `NavigationGuard`/`RouteLocationNormalized` import shapes against installed vue-router 5 types; if v5 renamed/moved a type, adjust the import only.

- [ ] **Step 3: Copy `wizardGuard.test.ts` verbatim**

```bash
SRC=/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src
APP=apps/philly-311/frontend/src
cp "$SRC/router/wizardGuard.test.ts" "$APP/router/wizardGuard.test.ts"
```
This test calls `wizardGuard` directly against the Pinia store — no router mount, no deferred pages. It ports unchanged (mechanical v5-type edits only if the compiler complains).

- [ ] **Step 4: Port `router.guards.test.ts` adapted (stub protected route)**

Read `SRC/router/router.guards.test.ts`. It builds a memory router from the real `routes` and pushes `/profile` (a deferred `requiresAuth` page). Re-home it onto a **local stub route table** so it tests `authGuard` behavior without lazy-loading a deferred page. Keep every assertion about guard behavior identical; change only how the protected route is provided.

Create `APP/src/router/router.guards.test.ts` modeled on the POC, with this substitution at the top of the router setup (adapt variable names to match the POC's structure):

```ts
import { defineComponent } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { authGuard } from './index'

const Stub = defineComponent({ template: '<div />' })

// A minimal table exercising authGuard: one public route, one protected.
// Replaces the POC's reliance on the real (now-deferred) /profile page.
const testRoutes = [
  { path: '/', component: Stub },
  { path: '/protected', component: Stub, meta: { requiresAuth: true } },
]

function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
  router.beforeEach(authGuard)
  return router
}
```
Then keep the POC's **four** behavioral cases (a public-route pass-through plus three protected-route cases), retargeting the protected ones from `/profile` → `/protected`:
1. public route (`/`) → guard passes through without checking auth.
2. unauthenticated → guard blocks (navigation does not land on `/protected`; `auth.signIn` called; `sessionStorage['auth:redirectTo']` set).
3. authenticated + `authReady` true → lands on `/protected`.
4. `authReady` initially false then flips true → guard awaits then resolves to `/protected`.

The `@phila/sso-vue` mock comes from the POC's own `vi.mock('@phila/sso-vue', ...)` block — copy that block verbatim from the POC test (it overrides the `setup.ts` fallback to control `isAuthenticated`/`authReady`).

- [ ] **Step 5: Run the router tests — expect green**

Run: `pnpm --filter @pinboard/philly-311 test:run -- src/router src/pages/AuthRedirectPage`
Expected: PASS — `wizardGuard.test.ts`, `router.guards.test.ts`, and `AuthRedirectPage.test.ts` green.
> `routes.test.ts` and `router.test.ts` are intentionally NOT ported (they assert deferred pages / the old HomePage); they return with their UI in later increments.

- [ ] **Step 6: Update `main.ts` if needed**

The `main.ts` from Task 1 already imports `./router`, which now installs guards. No change unless Step 2's type verification required an import tweak. Re-run boot to confirm guards don't break mount:

Run: `pnpm --filter @pinboard/philly-311 dev`
Expected: app still boots to the landing placeholder; navigating to `/auth/redirect` loads `AuthRedirectPage`. Stop the server.

- [ ] **Step 7: Type-check, format, commit**

```bash
pnpm --filter @pinboard/philly-311 type-check
pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/router apps/philly-311/frontend/src/pages
git commit -m "feat(philly-311): router on vue-router 5 — auth+wizard guards, auth redirect, guard tests"
```

---

## Task 7: Monorepo wiring + full green-baseline verification

**Files:**
- Modify: `turbo.json` (add `test:run` task)
- Modify: `package.json` (root — add `dev:311` script)

- [ ] **Step 1: Add a `test:run` task to root `turbo.json`**

In `turbo.json`, add to `tasks` (alongside `build`, `lint`, `type-check`):

```json
    "test:run": {
      "dependsOn": ["^build"],
      "outputs": []
    }
```
> `dependsOn: ["^build"]` ensures `@pinboard/ui` is built before the app's tests run (the `@pinboard/ui` alias points at source, but building first matches the type-check task and is safe). Other apps have no `test:run` script, so turbo skips them.

- [ ] **Step 2: Add `dev:311` to root `package.json` scripts**

Add alongside `dev:oem` / `dev:pc`:

```json
    "dev:311": "pnpm --filter @pinboard/philly-311 dev",
```

- [ ] **Step 3: Full green-baseline verification from the repo root**

Run each and confirm the expected result:

```bash
pnpm install                                          # resolves workspace incl. philly-311
turbo run build                                       # all apps + ui build; no regressions
turbo run type-check                                  # all green
turbo run test:run                                    # philly-311 foundation tests green; others skipped
```
Expected: all four succeed. `oem-flood-finder`, `primary-care-finder`, and `@pinboard/ui` must show no new failures.

- [ ] **Step 4: Manual smoke of the dev server**

Run: `pnpm dev:311`
Expected: app boots in `PinboardShell`, landing placeholder visible, no console errors at load (auth init does not block mount when unauthenticated). Stop the server.

- [ ] **Step 5: Commit**

```bash
git add turbo.json package.json
git commit -m "build(philly-311): add turbo test:run task + dev:311 script"
```

---

## Definition of Done (matches the spec)

From `pinboard-3/` root, with `NPM_FONTAWESOME_SECRET` available:

1. `pnpm install` resolves the workspace including `@pinboard/philly-311`. ✓
2. `pnpm --filter @pinboard/philly-311 type-check` passes. ✓
3. `pnpm --filter @pinboard/philly-311 test:run` — all ported foundation tests green. ✓
4. `pnpm --filter @pinboard/philly-311 build` succeeds. ✓
5. `pnpm dev:311` boots the app inside `PinboardShell`; routing + auth init work. ✓
6. `turbo run type-check && turbo run build && turbo run test:run` — no regressions to oem/pc/ui. ✓

## Out of scope (next increments)

Landing/browse redesign (Inc 2), wizard + answers + profile + your-reports port (Inc 3), CDK/deploy (Inc 4). The old `311-mobile-app/web/webportal` stays in place until the redesign lands.

---

## Implementation notes (post-merge record)

Deviations from the plan as written, all green and reviewed:

1. **`noUncheckedIndexedAccess` dropped** (Task 1 Step 3 showed it `true`). Because the
   `@pinboard/ui` path alias points at UI *source*, enabling the flag forced type errors
   in the shared `@pinboard/ui` package (not in philly-311's own code). To avoid editing
   shared code as a side effect, the flag was removed — which also makes the app's tsconfig
   match `oem-flood-finder` / `primary-care-finder` exactly (no app sets it). philly-311's
   own ported code is clean under the stricter flag; only `@pinboard/ui` source isn't.
2. **`useApiError.ts`** — constructor parameter-properties expanded to explicit fields,
   required by the shared base tsconfig's `erasableSyntaxOnly: true`. Behavior identical.
3. **`useApi.ts`** — `data` switched `ref` → `shallowRef` plus an explicit `UseApiReturn<T>`
   return interface, to make the generic return type nameable for declaration emit (TS2883).
   Sound: `data` is assigned wholesale (`data.value = json`); no deep reactivity is relied on.
4. **Test files excluded from `vue-tsc`** via the app tsconfig (matches the POC, which also
   excluded tests from type-checking; vitest transpiles without type-checking).

### Lint cleanup (resolved)

The monorepo's eslint (the POC had none) surfaced 4 errors in verbatim-ported code; all
fixed in a behavior-preserving way (`pnpm --filter @pinboard/philly-311 lint` now exits 0):

- `api311.ts` — two `prefer-const`: `let url` → `const`; the `let { response, sentBearer }`
  destructure split so `sentBearer` is `const` while `response` stays `let` (it's reassigned
  on 401-retry).
- `useMapBounds.ts` — removed the unused `PhilaMapInstance` interface (the code uses
  `MapVMComponent`); the `Ref` import stays (still used).
- `reportSubmission.ts` — `no-dynamic-delete`: replaced `delete this.customFields[field]`
  with `this.customFields = Object.fromEntries(Object.entries(...).filter(([k]) => k !== field))`,
  removing the key without a dynamic delete. Store tests stay green.

Remaining: 5 `vue/one-component-per-file` *warnings* in test-stub files (`setup.ts`, an inline
test component) — inherent to inline test stubs, eslint exits 0 on warnings, left as-is.
