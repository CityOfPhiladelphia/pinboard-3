# Philly 311 City-wide Map — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load all open 311 issues city-wide via progressive (eager, nearest-first) paging held in a Pinia store, cap zoom-out + panning to Philadelphia, and cluster points into count badges client-side with supercluster.

**Architecture:** A Pinia store (`useOpenIssuesStore`) owns the canonical issue set; it loads page 1 (seeded at the user's location → city-center fallback) for instant paint, then eager-pages the rest in the background via the backend's `nextCursor`, deduping by id. Re-entry to the map re-uses the cache unless a cheap `count` check or a TTL says it's stale. `useReportFinder` reads the store. Clustering is derived app-side from the loaded points + current zoom (supercluster) and rendered in the existing `Pinboard` `#map-content` slot; pan/zoom never refetch. Zoom floor + `maxBounds` come from the Pinboard config plus a one-line `MapPanel` change that exposes the real map instance to the slot.

**Tech Stack:** Vue 3 + TypeScript, Pinia, `@pinboard/ui` (Pinboard/MapPanel + re-exported `MapMarker`/`MapIconTextPin`), MapLibre via `@phila/phila-ui-map-core`, `supercluster`, Vitest + @vue/test-utils.

**Spec:** `docs/superpowers/specs/2026-06-17-philly-311-citywide-issues-map-design.md`
**Backend contract (built, on `311-mobile-app` branch `311-nearby-issues-paging`, pending dev deploy):** `GET /api/private/key/nearby-issues?lat&lng&radius&limit&cursor&withTotal&count` → `{ issues: Report[], nextCursor: string|null, total?: number }`; `count=true` → `{ total }`. `cursor`/`count`/`withTotal` optional; `nextCursor` is null on the final page.

**Branch:** work on `311-map-citywide-clustering` (already created off `311-staging`).

> **Dependency note:** the loader/store tasks (1–3) call the new endpoint params; they're unit-tested against a **mocked fetch**, so they don't require the backend deployed. End-to-end verification (Task 6, browser) needs the backend shipped to the dev stack — gate that step on the backend deploy.

---

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/utils/geoDefaults.ts` | geo seed defaults + city-wide radius | Modify |
| `src/composables/useMapBounds.ts` | existing `PHILLY_MAP_BOUNDS` reused for finder maxBounds | Reuse (no change) |
| `src/composables/useNearbyReports.ts` | one paginated fetch of the issues endpoint | Modify |
| `src/stores/openIssues.ts` | canonical dataset + progressive load + cache lifecycle | Create |
| `src/composables/useReportFinder.ts` | adapt to read the store; seed; filter options | Modify |
| `src/composables/useClusters.ts` | supercluster index → clusters/singles at a zoom | Create |
| `src/components/ClusterBadge.vue` | count-badge marker content | Create |
| `src/pages/LandingPage.vue` | render clusters vs pins; cluster-click; maxBounds/minZoom wiring | Modify |
| `src/main.ts` | `minZoom` in Pinboard config | Modify |
| `packages/ui/src/components/MapPanel.vue` | expose real map instance in slot props (additive) | Modify |

**Conventions:** run from `apps/philly-311/frontend`. Tests: `npx vitest run <file>`. Type-check: `npm run type-check`. The app mocks network via `vi.mock`/`vi.fn` on `fetch` or the `api311` helpers — match existing patterns in `src/composables/__tests__` and `src/stores/__tests__`. REQUIRED SUB-SKILL while implementing: @superpowers:test-driven-development. Existing Pinia store to mirror: `src/stores/reportSubmission.ts`.

---

### Task 1: City-wide radius constant (reuse existing Philly bounds)

**Do NOT create a new Philly bounding box.** One already exists:
`src/composables/useMapBounds.ts` exports `PHILLY_MAP_BOUNDS` (`[[-75.32, 39.83], [-74.92, 40.16]]`), deliberately padded to the CityBasemap tile cache (outside it the map 404s on tiles) and already used by the wizard pin map via `useMapBounds()`. Reuse that exact constant for the finder map's `maxBounds` (Task 5) so both maps share one pan limit and the tile-cache padding is preserved. This task only adds the city-wide radius.

**Files:** Modify `src/utils/geoDefaults.ts`; Test `src/utils/__tests__/geoDefaults.test.ts` (create if absent).

- [ ] **Step 1:** add to `geoDefaults.ts` (keep existing `DEFAULT_CENTER`, `DEFAULT_RADIUS`):
```ts
// Radius (meters) that covers the whole city from any in-bounds anchor — matches the API's raised MAX_RADIUS.
export const CITYWIDE_RADIUS = 60000
```
- [ ] **Step 2:** trivial test asserting `CITYWIDE_RADIUS === 60000`. Run `npx vitest run geoDefaults` → PASS.
- [ ] **Step 3: Commit** `feat(philly-311): city-wide seed radius constant`.

---

### Task 2: Paginated city-wide fetch in `useNearbyReports`

Extend the single-request composable to speak the new contract and return paging metadata. Today it does `api311Fetch({ path: '/private/key/nearby-issues', query: { lat, lng, radius, limit } })` and returns `Report[]`.

**Files:** Modify `src/composables/useNearbyReports.ts`; Test `src/composables/__tests__/useNearbyReports.test.ts`.

- [ ] **Step 1 (TDD):** add tests (mock `api311Fetch`/`fetch` per existing pattern) for a new `fetchPage` API:
  - returns `{ reports, nextCursor, total }` from a `{ issues, nextCursor, total }` body;
  - passes `cursor`, `withTotal`, `count` through to the query when provided;
  - `count`-only call returns `{ total }` and does not map issues.
- [ ] **Step 2:** implement. Add an exported `fetchPage(params: { lat; lng; radius; limit; cursor?; withTotal?; count? })` that builds the query (omit undefined; `withTotal`/`count` sent as `'true'` only when set) and returns `{ reports: Report[]; nextCursor: string | null; total?: number }`. Keep the existing `load(region)` working (it can delegate to `fetchPage` with `radius`+`limit`, ignoring cursor) so nothing else breaks yet. Reuse the existing `ApiNearbyIssue`→`Report` mapping.
- [ ] **Step 3:** `npx vitest run useNearbyReports` → PASS. **Commit** `feat(philly-311): paginated fetchPage for nearby-issues`.

---

### Task 3: `useOpenIssuesStore` — progressive load + cache lifecycle

**Files:** Create `src/stores/openIssues.ts`; Test `src/stores/__tests__/openIssues.test.ts`.

State: `reports: Report[]`, `byId: Map<string,Report>` (dedup), `seed: {lat,lng} | null`, `total: number | null`, `fetchedAt: number | null`, `isLoading`, `isStreaming`, `error`.

- [ ] **Step 1 (TDD):** tests with a mocked `fetchPage` (inject or `vi.mock('@/composables/useNearbyReports')`):
  - `ensureLoaded(seed)` on empty cache: fetches page 1 (`withTotal: true`), sets `reports`+`total`, `isLoading` false after page 1, then loops on `nextCursor` appending until `nextCursor === null`; final `reports` = union of all pages, deduped by id; `isStreaming` false at end.
  - mid-stream page error: stops streaming, keeps loaded pages, sets `error`, leaves `isStreaming` false.
  - `ensureLoaded` with a populated, fresh cache (within TTL): issues a `count` request; if `total` unchanged → no reload (fetchPage page-fetch not called again); if changed → reload.
  - cache older than TTL → reload regardless of count.
  - changed seed on re-entry does NOT clear the cache (data is city-wide); it only updates `seed`.
- [ ] **Step 2:** implement with `defineStore` (Options or Setup style — match `reportSubmission.ts`). Constants: `TTL_MS = 5 * 60_000`, `PAGE_LIMIT = 200`. `ensureLoaded` orchestrates page-1-then-eager-loop using `fetchPage`; dedup via `byId`. A `now: () => number` parameter (default `Date.now`) injected for testable TTL. Guard against concurrent `ensureLoaded` runs (in-flight flag).
- [ ] **Step 3:** `npx vitest run openIssues` → PASS. **Commit** `feat(philly-311): open-issues store with progressive load + count/TTL cache`.

---

### Task 4: Adapt `useReportFinder` to the store

**Files:** Modify `src/composables/useReportFinder.ts`; Test `src/composables/__tests__/useReportFinder.test.ts`.

- [ ] **Step 1 (TDD):** update/extend tests: `init()` seeds from geolocation (`getCurrentPosition`) → falls back to `DEFAULT_CENTER`, and calls the store's `ensureLoaded(seed)` (mock the store). `locations`/`filterOptions`/`reportById` now derive from the store's `reports`. `setCenter` re-centers the view (`searchOrUserLocation`) WITHOUT refetching (data is already city-wide). The radius-scoped `load` is gone.
- [ ] **Step 2:** implement. Replace `useNearbyReports().load` usage with the store: `const store = useOpenIssuesStore()`. `init()` resolves the seed and calls `store.ensureLoaded(seed)`. `locations`, `filterOptions`, `reportById` read `store.reports`. `isLoading`/`errorMessage` proxy the store. Keep the public `UseReportFinder` interface stable so `LandingPage` only needs minimal change; `setCenter` updates `searchOrUserLocation` only (used by address search to pan).
- [ ] **Step 3:** `npx vitest run useReportFinder` and the LandingPage test → PASS (adjust LandingPage test mocks if they asserted the old load path). **Commit** `feat(philly-311): finder reads open-issues store; city-wide seed`.

---

### Task 5: Expose the map instance + zoom/pan constraints

**Files:** Modify `packages/ui/src/components/MapPanel.vue`; Modify `src/main.ts`; Modify `src/pages/LandingPage.vue`. Tests: `packages/ui` MapPanel test if present; otherwise rely on Task 6 browser check for the map-bound behaviors.

- [ ] **Step 1 — expose the real map (packages/ui, additive):** in `MapPanel.vue` `slotProps`, replace `map: null as unknown` with the live instance: `map: (mapRef.value as any)?.map ?? null`. This is backward compatible (consumers got `null` before). Confirm `oem-flood-finder` still builds.
- [ ] **Step 2 — minZoom (app config):** in `main.ts` `createPinboard({ map: {...} })`, add `minZoom: 10.5` (tunable) and keep existing `center`/`zoom`/`mobile`. (`MapConfig` already supports `minZoom`.)
- [ ] **Step 3 — maxBounds (app, via exposed map):** add `map` to LandingPage's `#map-content` slot destructure (lines ~69-78 currently omit it). Reuse the **existing** `PHILLY_MAP_BOUNDS` from `@/composables/useMapBounds` (do NOT define a new box — see Task 1). When the exposed `map` becomes available (watch the slot's `map` prop; it's null until the MapLibre instance exists), call `map.setMaxBounds(PHILLY_MAP_BOUNDS)` once. Note: the existing `useMapBounds()` composable isn't a drop-in here — it expects a phila-ui-map-core `<Map>` *component* ref (reads `.map`/`.isLoaded` via `readExposed`), whereas the slot exposes the raw MapLibre instance — so call `setMaxBounds` directly, but share the constant. Verify `minZoom` actually reaches MapLibre; if `@phila/phila-ui-map-core` doesn't forward `minZoom` from config, also call `map.setMinZoom(10.5)` here (note which path worked).
- [ ] **Step 4:** `npm run type-check` clean; commit `feat(philly-311): expose map instance; cap zoom + maxBounds to Philly`. Final minZoom value tuned in Task 6.

---

### Task 6 is split: clustering, then verify.

### Task 6: Client-side clustering with supercluster

**Files:** add dep `supercluster`; Create `src/composables/useClusters.ts` + `src/components/ClusterBadge.vue` (+ tests); Modify `src/pages/LandingPage.vue`.

- [ ] **Step 1:** this repo is **pnpm** (`packageManager: pnpm@10.33.2`, pnpm-lock.yaml, workspace). From `apps/philly-311/frontend`, run `pnpm add supercluster && pnpm add -D @types/supercluster`. **Do NOT use `npm install`** (it would create an npm/pnpm split-brain in the workspace). Commit the updated `package.json` + root `pnpm-lock.yaml`.
- [ ] **Step 2 (TDD) — `useClusters`:** test that given points (id+lng+lat) and an integer zoom it returns clusters (with `pointCount` + lng/lat) and singles (with the source id); declusters as zoom increases; re-indexes when the point set changes. Implement `useClusters(points: Ref<BasicLocation[]>, zoom: Ref<number>)` wrapping `Supercluster` (radius ~60, maxZoom ~16); `getClusters([-180,-85,180,85], Math.round(zoom))`. **Throttle re-index** during streaming (rebuild at most every ~400ms, plus once when the set stops growing) so background pages don't thrash the index.
- [ ] **Step 3 (TDD) — `ClusterBadge.vue`:** a button showing the count; `aria-label` like `"{n} reports — zoom in"`; sized by magnitude (tiers). Decorative inner; the button is the interactive element.
- [ ] **Step 4 — wire into `LandingPage` `#map-content`:** feed `finder.locations` + slot `zoom` into `useClusters`; render each cluster feature as `<MapMarker>` containing `<ClusterBadge>` (click → use the exposed `map` + `supercluster.getClusterExpansionZoom(id)` then `map.easeTo({ center, zoom })`); render each single feature as the existing `<MapIconTextPin>` (unchanged). Replace the current one-marker-per-location loop with the clustered output.
- [ ] **Step 5:** `npx vitest run useClusters ClusterBadge` → PASS; `npm run type-check` clean. Commit `feat(philly-311): supercluster count-badge clustering on the finder map`.

---

### Task 7: Browser verification + final review (gate on backend dev deploy)

- [ ] **Step 1:** with the backend deployed to dev, `npm run dev`; load `/`. Verify: page-1 pins paint fast then the rest stream in nearest-first; clusters collapse/expand on zoom with correct counts; cluster-click eases to expansion zoom; zoom-out stops at the Philly-fitting floor (tune `minZoom`); panning is bounded to the city; map controls intact; no console errors.
- [ ] **Step 2:** check the network tab: page 1 carries `withTotal`, subsequent pages carry `cursor`, re-entry issues a `count` request and reuses cache when unchanged.
- [ ] **Step 3:** full app suite `npx vitest run` green; `npm run type-check` clean.
- [ ] **Step 4:** dispatch a final code-quality review over the whole FE diff; address findings.

---

## Risks & notes
- **Backend dependency:** Tasks 1–6 are unit-tested against mocked network and can be built before the backend ships; Task 7 (real behavior) gates on the dev deploy.
- **`minZoom` exact value** is tuned visually in Task 7 (~10–10.5).
- **`@pinboard/ui` change** (exposing the map) is additive and shared with `oem-flood-finder` — verify its build.
- **Re-index thrash:** background paging appends ~200 points repeatedly; the Task 6 throttle prevents a supercluster rebuild per page.
- **Marker volume:** supercluster keeps only visible clusters/singles in the DOM, so marker count stays low even at thousands of points — confirm in Task 7.
