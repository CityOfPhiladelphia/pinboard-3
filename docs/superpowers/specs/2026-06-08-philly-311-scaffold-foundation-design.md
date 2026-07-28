# Philly 311 — Increment 1: Scaffold + Foundation Port

- **Date:** 2026-06-08
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3` (monorepo)
- **Branch:** `feat/philly-311-scaffold`

## Background

The Philly 311 web portal currently lives as a standalone POC at
`311-mobile-app/web/webportal` (Vue 3, vue-router 4, Pinia, MSAL/SSO, hand-rolled
phila-ui shell). The UX direction is to move it onto the **Pinboard pattern** —
the `PinboardShell` + `Pinboard` (split map + locations panel) experience that
the `oem-flood-finder` and `primary-care-finder` apps already use from the
shared `@pinboard/ui` package. The target landing screen (Figma
`Landing page`, node `9386:25443`) is a 311-flavored finder: a left card panel
(report CTA, trending articles, "reports nearby" list) beside a full-bleed map
with category filter chips and an alert inspector sheet.

Rather than lift-and-shift the POC into the monorepo and then rip out the
throwaway chrome, we **scaffold a fresh app on the repo's conventions** and port
only the keep-worthy, framework-light domain logic — with its tests — across
green. The old POC stays in place as reference until the redesign lands.

This document specifies **Increment 1 only**: stand up `apps/philly-311` on the
monorepo's conventions and port the foundation (data, types, utils, composables,
store, router, auth) green. No redesign UI yet.

### Increment roadmap (context, not scope)

1. **Scaffold + foundation port** ← this spec
2. Landing/browse redesign to the Figma (`Pinboard` map + list, report-listing
   card, filter chips, trending strip)
3. Report wizard + answers + profile + your-reports ported/reskinned
4. CDK / deploy (after reviewing how oem/pc handle it)

## Goals

- A new monorepo app `apps/philly-311` that follows oem/pc conventions:
  `@repo/typescript-config`, `@repo/eslint-config`, Vite 7, vue-router 5, Vue
  3.5, `@pinboard/ui` wired as a `workspace:*` consumer.
- The framework-light **foundation** ported across with its **tests green**:
  `data/`, `types/`, `utils/`, `composables/`, `stores/`.
- Routing re-homed onto **vue-router 5**, including the auth + wizard guards and
  their tests.
- Auth (MSAL via `@phila/sso-vue`) wired in the app entry point.
- The app **boots** inside a minimal `PinboardShell` (real chrome, no redesign).
- Vitest brought into the monorepo, scoped to this app, runnable via
  `turbo run test:run`.

## Non-goals (explicitly deferred to later increments)

- The landing/browse redesign and any new UI beyond a boot skeleton.
- Porting the report **wizard** pages/components, answers, profile, your-reports.
- CDK / deploy wiring (`cdk/` is not moved in this increment).
- Removing or altering the old `311-mobile-app/web/webportal`.
- Reconciling `@phila/phila-ui-*` versions across the monorepo (per-app versions
  are fine under pnpm; we adopt what `@pinboard/ui` and the redesign need as we
  get to them).

## Decisions already made

| Decision | Choice |
| --- | --- |
| App name / dir | `apps/philly-311`, package `@pinboard/philly-311`, dev script `dev:311` |
| Approach | Fresh scaffold on repo conventions; port keep-worthy logic + tests (not lift-and-shift) |
| Git history | Clean copy; commit message references source repo + SHA |
| Old POC location | Left in place until the redesign lands |
| Router | Adopt **vue-router 5** from the start (no 4→5 migration debt later) |
| Vite | **7** (from the oem/pc template), not the POC's 8 |
| State | Keep **Pinia** for the wizard store (per-app dep; oem/pc don't use it, which is fine) |

## Architecture

### App layout

```
apps/philly-311/
├── city.config.json              # appName: "philly-311" (cdk wiring deferred)
└── frontend/
    ├── index.html
    ├── env.d.ts
    ├── package.json              # @pinboard/philly-311
    ├── tsconfig.json             # extends @repo/typescript-config/vite.json
    ├── eslint.config.mjs         # @repo/eslint-config viteJsConfig
    ├── vite.config.ts            # @ + @pinboard/ui aliases (oem template)
    ├── vitest.config.ts          # jsdom, vue plugin, @ alias
    ├── .env.development / .env.test / .env.production
    ├── public/
    └── src/
        ├── main.ts               # createApp + Pinia + sso-vue + router
        ├── App.vue               # minimal PinboardShell skeleton
        ├── router/               # routes + guards on vue-router 5
        ├── data/                 # ported verbatim
        ├── types/                # ported verbatim
        ├── utils/                # ported verbatim (+ tests)
        ├── composables/          # ported (+ tests)
        └── stores/               # reportSubmission (Pinia) (+ tests)
```

The app template (`package.json` scripts, `tsconfig.json`, `eslint.config.mjs`,
`vite.config.ts`, `env.d.ts`, `index.html`) is cloned from
`apps/oem-flood-finder/frontend` and adjusted for this app's needs (Pinia,
sso-vue/MSAL, maplibre, vitest).

### Conventions adopted from the monorepo

- `tsconfig.json` → `extends "@repo/typescript-config/vite.json"` with
  `paths: { "@/*": ["./src/*"], "@pinboard/ui": ["../../../packages/ui/src/index.ts"] }`.
- `eslint.config.mjs` → `export default viteJsConfig` from
  `@repo/eslint-config/base.js` (the POC had no eslint; we add it here as a good
  monorepo citizen).
- `vite.config.ts` → `@` and `@pinboard/ui` (+ `@pinboard/ui/style.css`) aliases,
  matching oem. The POC's per-package `@phila/.../dist/index.css` alias hack is
  **not** carried over — Increment 1 renders no phila components directly (the
  shell is `PinboardShell`); revisit when the wizard ports.
- Workspace inclusion is automatic via the root `apps/*/frontend` glob; no
  `pnpm-workspace.yaml` edit needed.

### Foundation port

All foundation modules are framework-light. Verified couplings:

- **vue-router:** none of `data/`, `types/`, `utils/`, `composables/`, `stores/`
  import vue-router. Router coupling is isolated to `router/index.ts`.
- **Pinia:** only `stores/reportSubmission.ts` (`defineStore`). Compatible with
  vue-router 5 / Vue 3.5.
- **Auth:** `@phila/sso-vue`'s `useAuth` is imported by `composables/api311.ts`,
  `composables/useApi.ts`, `composables/useKnowledgeArticles.ts`. These require
  the sso-vue plugin to be installed (done in `main.ts`).

Port targets (with tests where they exist today):

- `data/`: `service_types.json`, `service_type_questions.json`,
  `common_categories.json` — verbatim.
- `types/`: `api.ts`, `wizard.ts` — verbatim.
- `utils/`: `bounds`, `conditional`, `distance`, `fuzzy`, `mapTiles`, `photo`,
  `sanitize`, `serviceTypeMeta` (+ 6 test files) — verbatim.
- `composables/`: `api311`, `useAis`, `useApi`, `useApiError`,
  `useDebouncedSearch`, `useGeolocation`, `useKnowledgeArticles`, `useMapBounds`,
  `useNearbyReports`, `useServiceTypes`, `useWizardValidity` (+ 10 test files).
- `stores/`: `reportSubmission.ts` (+ test).

Ported test files must pass unchanged except for mechanical edits (import paths,
any vue-router 5 type changes). If a test would need a behavioral change to pass,
that is a signal to stop and investigate, not to edit the test.

### Router 4 → 5

`router/index.ts` carries `routes`, `authGuard`, and `wizardGuard`. The route
table for Increment 1 includes only what boots without the deferred pages — `/`
(a placeholder landing under `PinboardShell`) and the auth redirect;
wizard/answers/profile/your-reports routes are added in their own increments. The
guards (`authGuard` via sso-vue, `wizardGuard` reading the Pinia store) are
re-homed onto the vue-router 5 API. Guard signatures and `createWebHistory` are
stable across v4→v5; the port verifies behavior against the actual v5 types
rather than assuming.

**Router test disposition.** Because the route table is trimmed in this
increment, the POC's four router test files do **not** all port unchanged — and
that is expected, not a regression. The rule "ported tests pass unchanged" applies
to tests of *foundation logic*; tests that assert *deferred UI* travel with that
UI. Explicit per-file disposition:

| POC test file | Disposition in Inc 1 |
| --- | --- |
| `wizardGuard.test.ts` | **Port now.** Self-contained: exercises `wizardGuard` against the Pinia store on a memory router. Mechanical edits only (v5 types). |
| `router.guards.test.ts` | **Port now, adapted.** Tests `authGuard`, which is foundation, but currently pushes `/profile` (a deferred page). Re-home onto a **stub route component** so it tests guard behavior without lazy-loading deferred pages. Adapting the harness — not the assertions about guard behavior — is in-bounds. |
| `routes.test.ts` | **Defer.** Mounts all 13 routes and asserts each deferred page renders. It is inherently coupled to the full page set; it returns alongside those pages in later increments. |
| `router.test.ts` | **Defer.** Asserts `/` renders the old `HomePage` ("Report a problem"), which the redesign replaces. It returns when the landing exists (Inc 2). |

This is the one place a foundation test file is intentionally not carried over in
Inc 1; calling it out here prevents a planner from treating the trimmed route
table as a contradiction.

### Auth

`main.ts` installs, in order: `createPinia()`, `createB2CPlugin()` from
`@phila/sso-vue`, then `router`. `@azure/msal-browser` and `@phila/sso-vue` are
app dependencies (net-new to the monorepo; per-app deps, no conflict). Env vars
for B2C come from the ported `.env.*` files.

### App shell (boot skeleton)

`App.vue` wraps `<RouterView />` in `PinboardShell` with the 311 title/branding —
real chrome, but no redesign content. This proves the app mounts, the shell
renders, auth initializes, and routing works end to end. The Figma landing layout
is Increment 2.

### Build / test tooling

- **Vitest** is brought into the app (devDep + `vitest.config.ts`), mirroring the
  POC's jsdom + Vue-plugin setup, trimmed to what the foundation needs. The POC's
  `@phila/*` deps-optimizer block is included only if a ported test actually needs
  it; otherwise omitted until the wizard ports.
- Root `turbo.json` gains a **`test:run`** task (non-watch) so
  `turbo run test:run` runs the suite. Additive; other apps have no `test:run`
  script and are skipped.
- Root `package.json` gains `"dev:311": "pnpm --filter @pinboard/philly-311 dev"`.

## Data flow

Unchanged from the POC. `useApi`/`api311` build requests through the existing
fetch path, attaching the B2C token from `useAuth` when present; `.env.*` +
the Vite `/api` dev proxy target the deployed API. Composables expose reactive
results consumed by (future) pages. Nothing about data flow changes in this
increment — only where the files live and what router/build they run under.

## Error handling

The existing `useApiError` composable ports as-is and remains the single place
API errors are normalized. No new error-handling surface in this increment.

## Testing strategy

- Port every foundation test file in `data`/`types`/`utils`/`composables`/
  `stores`; **all must be green** under
  `pnpm --filter @pinboard/philly-311 test:run`.
- Router tests follow the per-file disposition in the "Router 4 → 5" section:
  `wizardGuard.test.ts` ports as-is, `router.guards.test.ts` ports with a stubbed
  protected route, and `routes.test.ts` / `router.test.ts` defer with their pages.
- For the tests that do port, a **behavioral** edit to make one pass is treated as
  a regression to investigate, not silently changed. (Re-homing a test's *harness*
  — import paths, v5 types, a stub route in place of a deferred page — is a
  mechanical edit, not a behavioral one.)
- No mocks added to replace real logic; the POC's test approach is preserved.

## Definition of Done

From `pinboard-3/` root, with `NPM_FONTAWESOME_SECRET` available:

1. `pnpm install` resolves the workspace including `@pinboard/philly-311`.
2. `pnpm --filter @pinboard/philly-311 type-check` passes.
3. `pnpm --filter @pinboard/philly-311 test:run` — **all ported foundation tests
   green**.
4. `pnpm --filter @pinboard/philly-311 build` succeeds.
5. `pnpm --filter @pinboard/philly-311 dev` boots the app inside `PinboardShell`;
   routing + auth init work (manual smoke).
6. `turbo run type-check && turbo run build && turbo run test:run` at root — no
   regressions to `oem-flood-finder`, `primary-care-finder`, or `@pinboard/ui`.

## Risks / watch-items (verify during implementation)

- **maplibre-gl** is an app dep used by foundation map utils (`mapTiles`,
  `useMapBounds`). Confirm it builds under Vite 7 in the monorepo (it did under
  Vite 8 standalone). No `@pinboard/ui` map component is consumed yet.
- **sso-vue / MSAL** init must not block app boot when unauthenticated (it
  doesn't in the POC; verify under the new shell).
- **Vitest** is the only test runner in the monorepo; confirm it doesn't perturb
  turbo caching for other apps (it shouldn't — scoped task + script).
- **Fontawesome registry** token is required for a full-workspace `pnpm install`
  (other apps need it); ensure it's set in the dev/CI environment.
- **Router v5 API drift** vs v4 in the guards — verify against installed types.

## Out of scope / next

See the increment roadmap above. Increment 2 (landing redesign) begins once this
foundation is green and merged.
