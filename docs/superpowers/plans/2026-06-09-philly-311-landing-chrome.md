# Philly 311 — Slice 2b: Landing Chrome — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the functional landing chrome to `/` — a report-CTA header block, a trending-articles strip, and working address search (recenter map + reload nearby reports) — on top of the slice-2a finder.

**Architecture:** A `locations-header` slot on `<Pinboard>` renders `ReportCallout` (CTA → `/report` placeholder) + `TrendingArticles` (top-N from `useTrendingArticles` → `/answers/:id` placeholders). `useReportFinder` gains an additive `setCenter`; `LandingPage`'s `@search` resolves the query via the ported `useAis.searchAddress` and calls `setCenter`. Two thin placeholder pages + routes (`/report`, `/answers/:id`) are added.

**Tech Stack:** Vue 3.5, vue-router 5, `@pinboard/ui` (`Pinboard` `locations-header`/`location-panel-search`/`@search`), `@/composables/useAis` (`searchAddress`), `@/composables/useKnowledgeArticles`, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-09-philly-311-landing-chrome-design.md`

**Conventions for every task:**
- All paths relative to `pinboard-3/` root. Branch `feat/philly-311-landing-chrome` (off `311-staging`, already created).
- `APP` = `apps/philly-311/frontend`. Run filtered: `pnpm --filter @pinboard/philly-311 <script>`.
- Prettier `semi: false, singleQuote: true, printWidth: 100` — `pnpm --filter @pinboard/philly-311 format` before each commit.
- Each task: failing test → run (fails) → implement → run (passes) → `type-check` + `lint` → `format` → commit. Keep `test:run` fully green at every commit.
- **Scope:** only `APP/src`. Do NOT touch `@pinboard/ui` or other apps. If type-check hits a `@pinboard/ui`-source error, STOP and report BLOCKED.

**Known APIs (verified):**
- `useReportFinder()` (slice 2a) returns `{ locations, searchOrUserLocation, isLoading, errorMessage, filter, init, setFilter, reportById }`. It owns `searchOrUserLocation` (`Ref<PinboardTypes.LatLon>`); `init()` geolocates then loads once; `DEFAULT_RADIUS = 1600`.
- `useKnowledgeArticles().loadArticles({ pageSize })` → `Promise<{ items: Article[]; nextPageToken? }>`; `Article = { id, title, url(slug), body?, serviceType?, lastPublishedAt?, url? }`.
- `searchAddress(query, signal?)` from `@/composables/useAis` → `Promise<AisFeature | null>`; `AisFeature = { streetAddress, zipCode?, lat, lng }`.
- `<Pinboard>` slot `locations-header` (no props); prop `location-panel-search?: string` (placeholder); emit `search: [string]`.
- The existing `wizardGuard` carves out `/report` (`if (to.path === '/report' || !to.path.startsWith('/report/')) return true`), so a `/report` placeholder renders without redirect.

---

## Task 1: `useReportFinder.setCenter` (additive)

**Files:** Modify `APP/src/composables/useReportFinder.ts`; modify `APP/src/composables/useReportFinder.test.ts`.

- [ ] **Step 1: Add the failing test** (append inside the existing `describe('useReportFinder', …)`)

```ts
  it('setCenter recenters and reloads for the new center', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    load.mockClear()
    await f.setCenter({ latitude: 40.1, longitude: -75.2 })
    expect(f.searchOrUserLocation.value).toEqual({ latitude: 40.1, longitude: -75.2 })
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 40.1, lng: -75.2, radius: 1600 }))
  })
```

- [ ] **Step 2: Run — expect FAIL** (`setCenter` is not a function). `pnpm --filter @pinboard/philly-311 test:run -- src/composables/useReportFinder`

- [ ] **Step 3: Implement.** In `useReportFinder.ts`:
  1. Add `setCenter` to the `UseReportFinder` interface:
     ```ts
       setCenter: (loc: PinboardTypes.LatLon) => Promise<void>
     ```
  2. Add the function (place above `init`, and have `init` reuse it):
     ```ts
       async function setCenter(loc: PinboardTypes.LatLon) {
         searchOrUserLocation.value = { latitude: loc.latitude, longitude: loc.longitude }
         await load({ lat: loc.latitude, lng: loc.longitude, radius: DEFAULT_RADIUS })
       }

       async function init() {
         const pos = await getCurrentPosition()
         const center = pos ?? DEFAULT_CENTER
         await setCenter({ latitude: center.lat, longitude: center.lng })
       }
     ```
     (Replace the existing `init` body with the above; it now delegates to `setCenter`.)
  3. Add `setCenter` to the returned object.

- [ ] **Step 4: Run — expect PASS** (new test + all existing 2a cases green). Then `type-check`, `lint`, `format`.

- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/composables/useReportFinder.ts apps/philly-311/frontend/src/composables/useReportFinder.test.ts
git commit -m "feat(philly-311): useReportFinder.setCenter — recenter + reload for a new center"
```

---

## Task 2: `useTrendingArticles` composable

**Files:** Create `APP/src/composables/useTrendingArticles.ts` + `useTrendingArticles.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Article } from '@/composables/useKnowledgeArticles'

const loadArticles = vi.fn()
vi.mock('@/composables/useKnowledgeArticles', () => ({
  useKnowledgeArticles: () => ({ loadArticles }),
}))

import { useTrendingArticles } from './useTrendingArticles'

const sample: Article[] = [
  { id: 'a1', title: 'How to report a pothole' },
  { id: 'a2', title: 'Trash pickup schedule' },
]

beforeEach(() => loadArticles.mockReset())

describe('useTrendingArticles', () => {
  it('loads the top-N articles (unwrapping .items)', async () => {
    loadArticles.mockResolvedValue({ items: sample })
    const t = useTrendingArticles()
    await t.init()
    expect(loadArticles).toHaveBeenCalledWith({ pageSize: 5 })
    expect(t.articles.value).toEqual(sample)
    expect(t.error.value).toBeNull()
  })
  it('resolves to an empty list on failure (no throw)', async () => {
    loadArticles.mockRejectedValue(new Error('boom'))
    const t = useTrendingArticles()
    await t.init()
    expect(t.articles.value).toEqual([])
    expect(t.error.value).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/composables/useTrendingArticles`

- [ ] **Step 3: Implement** (`useTrendingArticles.ts`)

```ts
// ABOUTME: Loads the top-N knowledge articles for the landing "Trending articles"
// ABOUTME: strip; failures resolve to an empty list so the strip simply hides.
import { ref, type Ref } from 'vue'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'

const TRENDING_COUNT = 5

export interface UseTrendingArticles {
  articles: Ref<Article[]>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  init: () => Promise<void>
}

export function useTrendingArticles(): UseTrendingArticles {
  const { loadArticles } = useKnowledgeArticles()
  const articles = ref<Article[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function init() {
    isLoading.value = true
    error.value = null
    try {
      const { items } = await loadArticles({ pageSize: TRENDING_COUNT })
      articles.value = items
    } catch (e) {
      error.value = e as Error
      articles.value = []
    } finally {
      isLoading.value = false
    }
  }

  return { articles, isLoading, error, init }
}
```

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.

- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/composables/useTrendingArticles.ts apps/philly-311/frontend/src/composables/useTrendingArticles.test.ts
git commit -m "feat(philly-311): useTrendingArticles — top-N knowledge articles"
```

---

## Task 3: `TrendingArticles.vue`

**Files:** Create `APP/src/components/TrendingArticles.vue` + `TrendingArticles.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import TrendingArticles from './TrendingArticles.vue'

const global = { stubs: { RouterLink: RouterLinkStub } }

describe('TrendingArticles', () => {
  it('renders a card per article linking to /answers/:id', () => {
    const articles = [{ id: 'a1', title: 'Pothole help' }, { id: 'a2', title: 'Trash days' }]
    const w = mount(TrendingArticles, { props: { articles }, global })
    const links = w.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
    expect(links[0].props('to')).toBe('/answers/a1')
    expect(w.text()).toContain('Pothole help')
  })
  it('renders nothing when there are no articles', () => {
    const w = mount(TrendingArticles, { props: { articles: [] }, global })
    expect(w.findAllComponents(RouterLinkStub)).toHaveLength(0)
    expect(w.find('.trending').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/components/TrendingArticles`

- [ ] **Step 3: Implement** (`TrendingArticles.vue`)

```vue
<!-- ABOUTME: Horizontal "Trending articles" strip for the landing header; each card
     links to the in-app /answers/:id page. Hidden when there are no articles. -->
<script setup lang="ts">
import type { Article } from '@/composables/useKnowledgeArticles'

defineProps<{ articles: Article[] }>()
</script>

<template>
  <section v-if="articles.length" class="trending">
    <h2 class="trending__title">Trending articles</h2>
    <ul class="trending__list">
      <li v-for="article in articles" :key="article.id" class="trending__item">
        <RouterLink :to="`/answers/${article.id}`" class="trending__card">
          {{ article.title }}
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.trending { margin-top: var(--spacing-m, 1rem); }
.trending__title { font-size: 1rem; font-weight: 700; margin-bottom: var(--spacing-xs, 0.5rem); }
.trending__list {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
  overflow-x: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}
.trending__item { flex: 0 0 auto; }
.trending__card {
  display: block;
  width: 14rem;
  padding: var(--spacing-s, 0.75rem);
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
}
</style>
```

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.

- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/TrendingArticles.vue apps/philly-311/frontend/src/components/TrendingArticles.test.ts
git commit -m "feat(philly-311): TrendingArticles — landing trending-articles strip"
```

---

## Task 4: `ReportCallout.vue`

**Files:** Create `APP/src/components/ReportCallout.vue` + `ReportCallout.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ReportCallout from './ReportCallout.vue'

describe('ReportCallout', () => {
  it('renders the heading and a CTA linking to /report', () => {
    const w = mount(ReportCallout, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.text()).toContain('Report Issues Around You')
    const cta = w.findComponent(RouterLinkStub)
    expect(cta.props('to')).toBe('/report')
    expect(cta.text()).toContain('Report an Issue')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/components/ReportCallout`

- [ ] **Step 3: Implement** (`ReportCallout.vue`)

```vue
<!-- ABOUTME: Landing-header callout: heading + lede + the primary "Report an Issue" CTA,
     which routes to /report (a placeholder until the report wizard lands in Increment 3). -->
<script setup lang="ts"></script>

<template>
  <section class="report-callout">
    <h2 class="report-callout__title">Report Issues Around You</h2>
    <p class="report-callout__lede">
      See something that needs attention? Report it and help improve neighborhoods across
      Philadelphia.
    </p>
    <RouterLink to="/report" class="report-callout__cta">Report an Issue</RouterLink>
  </section>
</template>

<style scoped>
.report-callout { padding: var(--spacing-m, 1rem); }
.report-callout__title { font-size: 1.25rem; font-weight: 700; margin: 0 0 var(--spacing-xs, 0.5rem); }
.report-callout__lede { margin: 0 0 var(--spacing-s, 0.75rem); color: var(--ui-color-grey-700, #4a4a4a); }
.report-callout__cta {
  display: inline-block;
  padding: var(--spacing-s, 0.75rem) var(--spacing-m, 1rem);
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
}
</style>
```

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.

- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/ReportCallout.vue apps/philly-311/frontend/src/components/ReportCallout.test.ts
git commit -m "feat(philly-311): ReportCallout — landing report CTA block"
```

---

## Task 5: Placeholder pages + routes (`/report`, `/answers/:id`)

**Files:** Create `APP/src/pages/ReportPage.vue`, `APP/src/pages/AnswerDetailPage.vue`; modify `APP/src/router/index.ts`; modify `APP/src/router/routes.test.ts` (create if absent).

- [ ] **Step 1: Create the placeholder pages**

`ReportPage.vue`:
```vue
<!-- ABOUTME: Placeholder for the report flow; replaced by the report wizard in Increment 3. -->
<script setup lang="ts"></script>
<template>
  <section class="report-page">
    <h1>Report a problem</h1>
    <p>The report flow is coming soon.</p>
  </section>
</template>
<style scoped>
.report-page { padding: var(--spacing-l, 2rem); }
</style>
```

`AnswerDetailPage.vue`:
```vue
<!-- ABOUTME: Placeholder for an in-app knowledge-article page; the real article render
     (loadArticle + sanitized body) ports in a later Answers slice. -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
const id = route.params.id as string
</script>
<template>
  <section class="answer-page">
    <h1>Answer</h1>
    <p>This answer is coming soon. (id: {{ id }})</p>
    <RouterLink to="/">Back to the map</RouterLink>
  </section>
</template>
<style scoped>
.answer-page { padding: var(--spacing-l, 2rem); }
</style>
```

- [ ] **Step 2: Add the routes.** In `APP/src/router/index.ts`, extend the `routes` array:

```ts
export const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/pages/LandingPage.vue') },
  { path: '/report', component: () => import('@/pages/ReportPage.vue') },
  { path: '/answers/:id', component: () => import('@/pages/AnswerDetailPage.vue') },
  { path: '/auth/redirect', component: () => import('@/pages/AuthRedirectPage.vue') },
]
```

- [ ] **Step 3: Write a route test** (`APP/src/router/routes.test.ts` — create it)

```ts
import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from './index'

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

describe('routes', () => {
  it('resolves the report placeholder', () => {
    const r = makeRouter()
    expect(r.resolve('/report').matched).toHaveLength(1)
  })
  it('resolves an answer placeholder with an id param', () => {
    const r = makeRouter()
    const resolved = r.resolve('/answers/abc123')
    expect(resolved.matched).toHaveLength(1)
    expect(resolved.params.id).toBe('abc123')
  })
})
```

- [ ] **Step 4: Run — expect PASS.** `pnpm --filter @pinboard/philly-311 test:run -- src/router/routes`
> Note: do NOT mount the pages through the full router with guards here (the `authGuard`/`wizardGuard` need sso/Pinia); `r.resolve(...)` only checks the route table, which is the unit under test.

- [ ] **Step 5: `type-check`, `lint`, `format`, commit**

```bash
git add apps/philly-311/frontend/src/pages/ReportPage.vue apps/philly-311/frontend/src/pages/AnswerDetailPage.vue apps/philly-311/frontend/src/router/index.ts apps/philly-311/frontend/src/router/routes.test.ts
git commit -m "feat(philly-311): /report + /answers/:id placeholder pages + routes"
```

---

## Task 6: Wire LandingPage — header slot + search

**Files:** Modify `APP/src/pages/LandingPage.vue`; modify `APP/src/pages/LandingPage.test.ts`.

- [ ] **Step 1: Extend the LandingPage test.** Update the local `@pinboard/ui` mock's `Pinboard` stub to (a) render the `locations-header` slot and (b) expose a button that emits `search`. Add mocks for `@/composables/useAis` and `@/composables/useKnowledgeArticles`. Then add assertions.

Replace the `Pinboard` stub's `setup` return with one that also renders the header slot + a search trigger:
```ts
    setup:
      (props, { slots, emit }) =>
      () =>
        h('div', { class: 'pinboard-stub' }, [
          h('div', { class: 'count' }, String(props.locations.length)),
          h('div', { class: 'header' }, slots['locations-header']?.()),
          h('button', { class: 'do-search', onClick: () => emit('search', '1234 Market St') }, 'search'),
          slots['map-content']?.({
            map: null, zoom: 12, isMobile: false, hoveredId: null, selectedId: null,
            mobileControlsTarget: null, mobileControlsTargetLeft: null,
            onHover: () => {}, onHoverEnd: () => {}, onSelect: () => {},
          }),
        ]),
```
Add `'search'` to the stub's `emits` array, and `RouterLink: RouterLinkStub` to the mount's `global.stubs` (the header renders `ReportCallout`/`TrendingArticles` which use `RouterLink`). Add these mocks near the others:
```ts
const searchAddress = vi.fn()
vi.mock('@/composables/useAis', () => ({ searchAddress: (...a: unknown[]) => searchAddress(...a) }))
const loadArticles = vi.fn().mockResolvedValue({ items: [{ id: 'a1', title: 'Pothole help' }] })
vi.mock('@/composables/useKnowledgeArticles', () => ({ useKnowledgeArticles: () => ({ loadArticles }) }))
```
Import `RouterLinkStub` from `@vue/test-utils` and mount with `{ global: { stubs: { RouterLink: RouterLinkStub } } }`. Then add tests:
```ts
  it('renders the report callout + trending articles in the header slot', async () => {
    searchAddress.mockResolvedValue(null)
    const w = mount(LandingPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    expect(w.find('.header').text()).toContain('Report an Issue')
    expect(w.find('.header').text()).toContain('Trending articles')
  })
  it('resolves a search query and recenters the finder', async () => {
    searchAddress.mockResolvedValue({ streetAddress: '1234 Market St', lat: 39.95, lng: -75.16 })
    const w = mount(LandingPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    load.mockClear()
    await w.find('.do-search').trigger('click')
    await flushPromises()
    expect(searchAddress).toHaveBeenCalledWith('1234 Market St')
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 39.95, lng: -75.16 }))
  })
```
> The existing "mounts the Pinboard with mapped locations" test stays; update its `mount(LandingPage)` call to pass the `RouterLink` stub too.

- [ ] **Step 2: Run — expect FAIL** (header slot + search not wired). `pnpm --filter @pinboard/philly-311 test:run -- src/pages/LandingPage`

- [ ] **Step 3: Implement** — extend `LandingPage.vue`'s `<script setup>` and template.

Add imports + wiring to `<script setup>`:
```ts
import { searchAddress } from '@/composables/useAis'
import { useTrendingArticles } from '@/composables/useTrendingArticles'
import ReportCallout from '@/components/ReportCallout.vue'
import TrendingArticles from '@/components/TrendingArticles.vue'

const trending = useTrendingArticles()
onMounted(() => {
  void finder.init()
  void trending.init()
})

const searchPlaceholder = 'Search by address or ZIP'
async function onSearch(query: string) {
  const feature = await searchAddress(query)
  if (feature) finder.setCenter({ latitude: feature.lat, longitude: feature.lng })
}
```
(Remove the now-duplicated `onMounted(() => void finder.init())` line from slice 2a — there must be exactly one `onMounted`.)

Add the prop + emit + header slot to the `<Pinboard>`:
```html
  <Pinboard
    :locations="finder.locations.value"
    :search-or-user-location="finder.searchOrUserLocation.value"
    :is-loading="finder.isLoading.value"
    :error-message="finder.errorMessage.value"
    :location-panel-filter="filterOptions"
    :location-panel-search="searchPlaceholder"
    @selected-locations-filter="finder.setFilter"
    @search="onSearch"
  >
    <template #locations-header>
      <ReportCallout />
      <TrendingArticles :articles="trending.articles.value" />
    </template>

    <!-- existing #location-detail and #map-content templates unchanged -->
```

- [ ] **Step 4: Run — expect PASS** (new + existing LandingPage tests). Then `type-check`, `lint`, `format`.

- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/pages/LandingPage.vue apps/philly-311/frontend/src/pages/LandingPage.test.ts
git commit -m "feat(philly-311): LandingPage — header CTA + trending strip + address search"
```

---

## Task 7: Full verification

**Files:** none.

- [ ] **Step 1: App gates**

```bash
pnpm --filter @pinboard/philly-311 type-check   # PASS
pnpm --filter @pinboard/philly-311 lint          # exit 0
pnpm --filter @pinboard/philly-311 test:run      # all green (2a + new)
pnpm --filter @pinboard/philly-311 build         # PASS
```

- [ ] **Step 2: Monorepo no-regressions**

```bash
pnpm build && pnpm type-check && pnpm exec turbo run test:run
git diff --name-only 311-staging..HEAD -- . ':(exclude)apps/philly-311/**' ':(exclude)docs/**'   # empty
```

- [ ] **Step 3: Optional real smoke** — `pnpm dev:311`, confirm the header (CTA + trending) renders in the panel, the CTA routes to `/report`, a trending card routes to `/answers/:id`, and a search recenters the map. (Live address search needs network AIS; if unavailable, the wiring is verified by tests.) Stop the server.

---

## Definition of Done (matches the spec)

1. `/` shows the report CTA + a trending-articles strip in the panel header.
2. CTA routes to a `/report` placeholder; trending cards route to `/answers/:id` placeholders.
3. Address search recenters the map and reloads nearby reports for the resolved location.
4. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`.
5. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope (later)

Fidelity slice (with 2a.1, after Inc 3): navbar search placement, chips-over-map, "All Filters". The real Answers pages + "See all". Increment 3 = the report wizard (replaces `/report`). Keyword search, list sort.
