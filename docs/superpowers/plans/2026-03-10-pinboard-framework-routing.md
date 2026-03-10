# Pinboard Framework Routing & Slot-Based Architecture — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move routing, views, and layout from oem-flood-finder into the pinboard framework (`packages/ui`), making apps pure configuration + slot content.

**Architecture:** The framework exports a `createPinboard()` Vue plugin that installs vue-router and provides config via inject. `Pinboard.vue` captures app slots and provides them via inject so routed views (`HomeView`, `FinderView`) can render them. Apps pass a `useLocations` composable and map config through the plugin, and fill in UI via named slots.

**Tech Stack:** Vue 3 (`<script setup>` + TypeScript), vue-router 5, `@phila/phila-ui-map-core` (MapLibre wrapper), `@phila/phila-ui-collapse-panel`, pnpm workspace monorepo.

**Spec:** `docs/superpowers/specs/2026-03-10-pinboard-framework-routing-design.md`

**Important context:**
- `packages/ui` is a library built with Vite (lib mode). It currently only exports `Pinboard` from `src/index.ts`.
- `vue-router` is NOT a dependency of `packages/ui` yet — it must be added.
- `@phila/phila-ui-collapse-panel` is NOT a dependency of `packages/ui` yet — it must be added (FinderView uses it).
- `SearchFilterPanel.vue` currently imports `LocationDTO` from the oem-flood-finder app via a relative path — this cross-package import must be removed.
- `vite.config.ts` externals list must include `vue-router` since it's a peer dependency.
- The app currently has its own router in `frontend/src/router/index.ts` — this will be deleted.
- Andy runs the dev server himself — never start one.

---

## Chunk 1: Framework Foundation (types, plugin, Pinboard.vue)

### Task 1: Add vue-router dependency to packages/ui

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `packages/ui/vite.config.ts`

- [ ] **Step 1: Add vue-router as a peer dependency and dev dependency**

In `packages/ui/package.json`, add to `peerDependencies`:
```json
"vue-router": "^5.0.0"
```
And add to `devDependencies`:
```json
"vue-router": "^5.0.1"
```

- [ ] **Step 2: Add @phila/phila-ui-collapse-panel as a dependency**

In `packages/ui/package.json`, add to `dependencies`:
```json
"@phila/phila-ui-collapse-panel": "^0.0.3"
```

- [ ] **Step 3: Add vue-router to Vite externals**

In `packages/ui/vite.config.ts`, add `'vue-router'` to `rollupOptions.external` array and `output.globals`:
```ts
external: ['vue', '@pinboard/core', 'vue-router', '@phila/phila-ui-collapse-panel'],
output: {
  globals: {
    vue: 'Vue',
    '@pinboard/core': 'PinboardCore',
    'vue-router': 'VueRouter',
  },
},
```

- [ ] **Step 4: Install dependencies**

Run from the workspace root: `pnpm install`

- [ ] **Step 5: Commit**

```bash
git add packages/ui/package.json packages/ui/vite.config.ts pnpm-lock.yaml
git commit -m "add vue-router and collapse-panel deps to @pinboard/ui"
```

---

### Task 2: Create types and injection keys

**Files:**
- Create: `packages/ui/src/types.ts`

- [ ] **Step 1: Create the types file**

```ts
// packages/ui/src/types.ts
import type { InjectionKey, Ref, Slots } from 'vue'

export type MapControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface MapConfig {
  center?: [number, number]
  zoom?: number
  pitch?: number
  bearing?: number
  minZoom?: number
  maxZoom?: number
  basemapChangeControls?: { toggle?: boolean; dropdown?: boolean; position?: MapControlPosition }
  navigationControls?: { position?: MapControlPosition }
  geolocationControl?: { position?: MapControlPosition }
  mapSearchControl?: { position?: MapControlPosition; placeholder?: string }
  ariaLabel?: string
}

export type State =
  | { kind: 'Loading' }
  | { kind: 'Loaded'; data: unknown }
  | { kind: 'Error'; message: string }

export interface PinboardConfig {
  title: string
  useLocations: () => Ref<State>
  map?: MapConfig
}

export const PINBOARD_CONFIG_KEY: InjectionKey<PinboardConfig> = Symbol('pinboard-config')
export const PINBOARD_SLOTS_KEY: InjectionKey<Slots> = Symbol('pinboard-slots')
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/types.ts
git commit -m "add PinboardConfig types and injection keys"
```

---

### Task 3: Create the createPinboard plugin

**Files:**
- Create: `packages/ui/src/plugin.ts`

- [ ] **Step 1: Create the plugin file**

```ts
// packages/ui/src/plugin.ts
import type { Plugin } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { PinboardConfig } from './types'
import { PINBOARD_CONFIG_KEY } from './types'
import HomeView from './views/HomeView.vue'
import FinderView from './views/FinderView.vue'

export function createPinboard(config: PinboardConfig): Plugin {
  return {
    install(app) {
      const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: [
          { path: '/', component: HomeView },
          { path: '/finder', component: FinderView },
        ],
      })

      app.use(router)
      app.provide(PINBOARD_CONFIG_KEY, config)
    },
  }
}
```

Note: This file imports HomeView and FinderView which don't exist yet. They'll be created in Chunk 2. This file will not compile until those are created, which is fine — we'll commit it together with the views.

- [ ] **Step 2: Commit** (deferred to after views are created in Task 5)

---

### Task 4: Update Pinboard.vue

**Files:**
- Modify: `packages/ui/src/components/Pinboard.vue`

Pinboard.vue changes:
- Remove `title` prop — inject it from `PINBOARD_CONFIG_KEY`
- Add `RouterView` rendering internally
- Add automatic mobile nav links (Home, Finder)
- Capture slots and provide them via `PINBOARD_SLOTS_KEY`

- [ ] **Step 1: Rewrite Pinboard.vue**

```vue
<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import MobileNavPanel from './MobileNavPanel.vue'
import { h, inject, provide, useSlots, type FunctionalComponent } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { PINBOARD_CONFIG_KEY, PINBOARD_SLOTS_KEY } from '../types'

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = useSlots()

provide(PINBOARD_SLOTS_KEY, slots)

const MobileNavContent: FunctionalComponent = () =>
  h(MobileNavPanel, null, {
    default: () => [
      h('h4', null, h(RouterLink, { to: '/' }, () => 'Home')),
      h('h4', null, h(RouterLink, { to: '/finder' }, () => 'Finder')),
    ],
  })
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :show-trusted-site="true"
      :mobile-nav="MobileNavContent"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
        brandingLink: { text: config.title, href: '/' },
      }"
    />

    <main class="pinboard-main">
      <RouterView />
    </main>

    <AppFooter :sub-footer-only="true" />
  </div>
</template>

<style>
.phila-navbar .phila-mobile-nav .nav-flyout {
  flex: 0 0 25rem;
  max-width: 25rem;
  height: calc(100vh - var(--nav-bottom));
}

.phila-navbar .phila-mobile-nav .nav-flyout .p-4 {
  display: flex;
  flex-direction: column;
  row-gap: var(--spacing-m);
}
</style>

<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.pinboard-main {
  flex: 1;
  overflow: hidden;
}
</style>
```

Key changes from current Pinboard.vue:
- `defineProps<{ title: string }>()` removed, replaced with `inject(PINBOARD_CONFIG_KEY)!`
- `<slot />` replaced with `<RouterView />`
- `MobileNavContent` now renders hardcoded Home/Finder RouterLinks instead of using a `mobile-nav` slot
- `useSlots()` captures app slots and `provide(PINBOARD_SLOTS_KEY, slots)` makes them available to views
- `defineSlots` removed (no longer needed — slots are provided, not rendered here)
- Imports added: `RouterLink`, `RouterView`, injection keys

- [ ] **Step 2: Commit** (deferred to after views are created in Task 5)

---

## Chunk 2: Framework Views

### Task 5: Create HomeView and FinderView in packages/ui

**Files:**
- Create: `packages/ui/src/views/HomeView.vue`
- Create: `packages/ui/src/views/FinderView.vue`

- [ ] **Step 1: Create the views directory**

```bash
mkdir -p packages/ui/src/views
```

- [ ] **Step 2: Create HomeView.vue**

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { PINBOARD_CONFIG_KEY, PINBOARD_SLOTS_KEY } from '../types'

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = inject(PINBOARD_SLOTS_KEY)!
</script>

<template>
  <div class="home-view content">
    <h1>{{ config.title }}</h1>
    <component v-if="slots.home" :is="() => slots.home!()" />
  </div>
</template>

<style scoped>
.home-view {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3rem 2rem;
}
</style>
```

- [ ] **Step 3: Create FinderView.vue**

This is the most complex component. It takes the layout and state management from the app's FinderView, but replaces app-specific components with injected slots.

```vue
<script setup lang="ts">
import { ref, nextTick, inject, type Ref } from 'vue'
import { CollapsePanel } from '@phila/phila-ui-collapse-panel'
import { PINBOARD_CONFIG_KEY, PINBOARD_SLOTS_KEY, type State } from '../types'
import SearchFilterPanel from '../components/SearchFilterPanel.vue'
import MapPanel from '../components/MapPanel.vue'

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = inject(PINBOARD_SLOTS_KEY)!

const state: Ref<State> = config.useLocations()

const selectedLocation = ref<unknown | null>(null)
const returnFocusTarget = ref<HTMLElement | null>(null)

function onSelect(location: unknown, onClickOpen: () => void) {
  returnFocusTarget.value = document.activeElement as HTMLElement
  selectedLocation.value = location
  onClickOpen()
}

function onClose(onClickToggle: (e: Event) => void) {
  return (e: MouseEvent) => {
    onClickToggle(e)
    selectedLocation.value = null
    nextTick(() => returnFocusTarget.value?.focus())
  }
}
</script>

<template>
  <CollapsePanel id="detail-panel" class="detail-panel-wrapper">
    <template #toggle="{ onClickOpen }">
      <div class="finder-panel">

        <div class="finder-panel-locations">
          <SearchFilterPanel v-if="state.kind === 'Loaded'" :locations="state.data" />

          <div v-if="state.kind === 'Loading'" class="status-message">
            Loading...
          </div>

          <div v-else-if="state.kind === 'Error'" class="status-message status-message--error">
            {{ state.message }}
          </div>

          <component
            v-else-if="state.kind === 'Loaded' && slots['location-list']"
            :is="() => slots['location-list']!({
              locations: state.data,
              onSelect: (loc: unknown) => onSelect(loc, onClickOpen),
            })"
          />
        </div>

        <div class="finder-panel-map">
          <MapPanel
            v-if="state.kind === 'Loaded'"
            :config="config.map"
            :locations="state.data"
            :map-content-slot="slots['map-content']"
          />
        </div>

      </div>
    </template>

    <template #default="{ hidden, onClickToggle }">
      <div v-show="!hidden" id="detail-panel" class="detail-overlay">
        <component
          v-if="selectedLocation !== null && slots['location-detail']"
          :is="() => slots['location-detail']!({
            location: selectedLocation,
            onClose: onClose(onClickToggle),
          })"
        />
      </div>
    </template>
  </CollapsePanel>
</template>

<style scoped>
.detail-panel-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.finder-panel {
  display: flex;
  width: 100%;
  height: 100%;
}

.finder-panel-locations {
  display: flex;
  flex-direction: column;
  width: 25%;
  border-right: 1px solid #ccc;
  overflow: hidden;
}

.status-message {
  padding: 1rem;
  color: var(--Schemes-On-Surface, #333);
}

.status-message--error {
  color: var(--Schemes-Error, #b3261e);
}

.finder-panel-locations > :deep(.location-list) {
  flex: 1;
  overflow-y: auto;
}

.finder-panel-map {
  width: 75%;
  overflow: hidden;
}

.detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 33%;
  z-index: 10;
  background: var(--Schemes-Surface-Bright, white);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
```

Key differences from the app's current FinderView:
- `useLocations()` comes from `config.useLocations()` (injected), not a local import
- `LocationList` is replaced by `slots['location-list']({ locations, onSelect })`
- `LocationDetail` is replaced by `slots['location-detail']({ location, onClose })`
- `MapPanel` receives config and a `map-content-slot` prop
- `SearchFilterPanel` import uses a relative path within the package (no more cross-package import)
- Types are `unknown` instead of app-specific `Location`/`LocationDTO`

- [ ] **Step 4: Commit all framework changes so far (plugin, Pinboard, views)**

```bash
git add packages/ui/src/plugin.ts packages/ui/src/types.ts packages/ui/src/components/Pinboard.vue packages/ui/src/views/HomeView.vue packages/ui/src/views/FinderView.vue
git commit -m "add createPinboard plugin, types, and framework views"
```

---

### Task 6: Update MapPanel.vue to accept config and slot

**Files:**
- Modify: `packages/ui/src/components/MapPanel.vue`

- [ ] **Step 1: Update MapPanel.vue**

```vue
<script setup lang="ts">
import { Map as PhilaMap } from '@phila/phila-ui-map-core'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import type { MapConfig } from '../types'

const props = defineProps<{
  config?: MapConfig
  locations?: unknown
  mapContentSlot?: (props: { locations: unknown; map: unknown }) => unknown
}>()
</script>

<template>
  <div class="map-pane">
    <PhilaMap
      v-bind="config"
    >
      <component
        v-if="mapContentSlot"
        :is="() => mapContentSlot!({ locations, map: null })"
      />
    </PhilaMap>
  </div>
</template>

<style scoped>
.map-pane {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
```

Note: `map: null` is a placeholder. To pass the actual MapLibre map instance, MapPanel would need to listen for PhilaMap's `@load` event and store the map ref. This can be enhanced later — the slot API is in place.

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/MapPanel.vue
git commit -m "update MapPanel to accept config and map-content slot"
```

---

### Task 7: Fix SearchFilterPanel cross-package import

**Files:**
- Modify: `packages/ui/src/components/SearchFilterPanel.vue`

- [ ] **Step 1: Remove the oem-flood-finder type import and use unknown**

The current file imports `LocationDTO` from the app. Replace with a generic prop type.

```vue
<script setup lang="ts">
defineProps<{
  locations: unknown
}>()
</script>

<template>
  <div class="search-filter-pane">
    <p>Search &amp; Filter Controls</p>
  </div>
</template>

<style scoped>
.search-filter-pane {
  padding: 1rem;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/SearchFilterPanel.vue
git commit -m "remove cross-package type import from SearchFilterPanel"
```

---

### Task 8: Update packages/ui exports

**Files:**
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Export createPinboard and Pinboard**

```ts
export { default as Pinboard } from './components/Pinboard.vue'
export { createPinboard } from './plugin'
export type { PinboardConfig, MapConfig, State } from './types'
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/index.ts
git commit -m "export createPinboard plugin and config types"
```

---

## Chunk 3: Update oem-flood-finder App

### Task 9: Update oem-flood-finder main.ts to use plugin

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/main.ts`

- [ ] **Step 1: Replace router with createPinboard plugin**

```ts
import { createApp } from 'vue'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import { useLocations } from './composables/useLocations'

const app = createApp(App)

app.use(createPinboard({
  title: 'OEM Flood Finder',
  useLocations: () => useLocations(),
  map: {
    center: [-75.16, 39.95],
    zoom: 11,
  },
}))

app.mount('#app')
```

- [ ] **Step 2: Commit**

```bash
git add apps/oem-flood-finder/frontend/src/main.ts
git commit -m "use createPinboard plugin instead of manual router"
```

---

### Task 10: Update oem-flood-finder App.vue to use slots

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/App.vue`

- [ ] **Step 1: Rewrite App.vue with slot-based API**

```vue
<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { useRouter } from 'vue-router'
import LocationList from './components/LocationList.vue'
import LocationDetail from './components/LocationDetail.vue'

const router = useRouter()
</script>

<template>
  <Pinboard>
    <template #home>
      <section class="hero">
        <p class="hero-subtitle">
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
          pellentesque sem placerat.
        </p>
        <div class="hero-actions">
          <PhilaButton text="View gauges" @click="router.push('/finder')" />
          <PhilaButton text="View cameras" @click="router.push('/finder')" />
        </div>
      </section>

      <section class="body-content">
        <h2>Heading</h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
          pellentesque sem placerat.
        </p>
        <p>
          In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor.
          Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
        </p>
      </section>
    </template>

    <template #location-list="{ locations, onSelect }">
      <LocationList
        :locations="locations"
        @card-click="(loc) => onSelect(loc)"
      />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location"
        :on-close="onClose"
      />
    </template>
  </Pinboard>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.hero {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  background-color: var(--Schemes-Surface);
}

.hero-subtitle {
  max-width: 40rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.body-content {
  max-width: 50rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
```

Key changes:
- `RouterLink`, `RouterView` removed — framework handles routing
- `mobile-nav` slot removed — framework renders nav links
- `#home`, `#location-list`, `#location-detail` slots added
- `#map-content` slot omitted for now (no custom layers yet)

- [ ] **Step 2: Commit**

```bash
git add apps/oem-flood-finder/frontend/src/App.vue
git commit -m "use Pinboard slot API in App.vue"
```

---

### Task 11: Delete app-level router and views

**Files:**
- Delete: `apps/oem-flood-finder/frontend/src/router/index.ts`
- Delete: `apps/oem-flood-finder/frontend/src/router/` (directory)
- Delete: `apps/oem-flood-finder/frontend/src/views/HomeView.vue`
- Delete: `apps/oem-flood-finder/frontend/src/views/FinderView.vue`
- Delete: `apps/oem-flood-finder/frontend/src/views/` (directory)

- [ ] **Step 1: Remove the router directory and views directory**

```bash
rm -rf apps/oem-flood-finder/frontend/src/router
rm -rf apps/oem-flood-finder/frontend/src/views
```

- [ ] **Step 2: Commit**

```bash
git add -A apps/oem-flood-finder/frontend/src/router apps/oem-flood-finder/frontend/src/views
git commit -m "remove app-level router and views (now in framework)"
```

---

### Task 12: Verify the build

**Files:** none (verification only)

- [ ] **Step 1: Build packages/ui**

Run: `cd packages/ui && pnpm build`
Expected: Build succeeds, outputs to `dist/`

- [ ] **Step 2: Build oem-flood-finder frontend**

Run: `cd apps/oem-flood-finder/frontend && pnpm build`
Expected: Build succeeds. If there are type errors, fix them.

- [ ] **Step 3: Commit any build fixes if needed**

---

## Chunk 4: Manual Verification

### Task 13: Manual smoke test

- [ ] **Step 1: Andy starts the dev server and verifies:**

1. Home page (`/`) shows "OEM Flood Finder" as heading with the app's hero content
2. Finder page (`/finder`) shows the location list on the left, map on the right
3. Clicking a location card opens the detail overlay
4. Closing the detail overlay returns focus properly
5. Mobile nav shows Home/Finder links
6. Map renders with MapLibre (no continuous panning — CSS is imported)
7. Loading and error states display correctly

- [ ] **Step 2: Commit any fixes from smoke testing**

- [ ] **Step 3: Update handoff notes**

Update both `.claude` handoff files:
- `apps/oem-flood-finder/.claude/handoff.md` — note the refactor is complete, app now uses slot API
- `apps/oem-flood-finder/.claude/CLAUDE.md` — update structure to reflect removed files
- `pinboard-3/.claude/` — add a handoff noting the new framework architecture
