# Primary Care Finder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port primary-care-finder to pinboard-3 as a new app using the createPinboard plugin and slot-based architecture.

**Architecture:** Framework changes first (LocationsPanel, State type, Location interface), then migrate oem-flood-finder to validate, then scaffold and build primary-care-finder.

**Tech Stack:** Vue 3, TypeScript, Vite, vue-i18n, @pinboard/ui, @phila/phila-ui-* components, ArcGIS REST API

**Spec:** `docs/superpowers/specs/2026-03-11-primary-care-finder-design.md`

---

## Chunk 1: Framework Changes (packages/ui)

### Task 1: Add Location interface and update State type

**Files:**
- Modify: `packages/ui/src/types.ts`

- [ ] **Step 1: Add Location interface and update State.data type**

In `packages/ui/src/types.ts`, add the `Location` interface and change `State`'s loaded data from `unknown` to `Location[]`:

```ts
export interface Location {
  id: string
  [key: string]: unknown
}

export type State =
  | { kind: 'Loading' }
  | { kind: 'Loaded'; data: Location[] }
  | { kind: 'Error'; message: string }
```

- [ ] **Step 2: Export Location from index.ts**

In `packages/ui/src/index.ts`, add `Location` to the type exports:

```ts
export type { PinboardConfig, MapConfig, State, Location } from './types'
```

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/types.ts packages/ui/src/index.ts
git commit -m "feat(ui): add Location interface and type State.data as Location[]"
```

### Task 2: Add @phila/phila-ui-cards as dependency of packages/ui

**Files:**
- Modify: `packages/ui/package.json`

- [ ] **Step 1: Add dependency**

Add `"@phila/phila-ui-cards": "^0.1.1"` to `dependencies` in `packages/ui/package.json`.

- [ ] **Step 2: Install**

Run: `cd packages/ui && pnpm install`

- [ ] **Step 3: Commit**

```bash
git add packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): add @phila/phila-ui-cards dependency for LocationsPanel"
```

### Task 3: Create LocationsPanel.vue

**Files:**
- Create: `packages/ui/src/components/LocationsPanel.vue`

- [ ] **Step 1: Create the component**

Create `packages/ui/src/components/LocationsPanel.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'
import type { Location } from '../types'

defineProps<{
  locations: Location[]
  hoveredId?: string | null
  selectedId?: string | null
}>()

const emit = defineEmits<{
  select: [location: Location]
  hover: [id: string]
  'hover-end': []
}>()

const pendingKeydown = ref(false)

function onCardKeyup(location: Location) {
  if (pendingKeydown.value) {
    emit('select', location)
    pendingKeydown.value = false
  }
}
</script>

<template>
  <div class="location-list">
    <BaseCard
      v-for="location in locations"
      :key="location.id"
      layout="vertical"
      :class="['location-card', {
        'location-card--hovered': hoveredId === location.id,
        'location-card--selected': selectedId === location.id,
      }]"
      tabindex="0"
      @click="emit('select', location)"
      @mouseenter="emit('hover', location.id)"
      @mouseleave="emit('hover-end')"
      @keydown.enter="pendingKeydown = true"
      @keyup.enter="onCardKeyup(location)"
    >
      <CardContent>
        <slot name="location-card" :location="location" :is-hovered="hoveredId === location.id" :is-selected="selectedId === location.id" />
      </CardContent>
    </BaseCard>
  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-card {
  cursor: pointer;
}

.location-card--hovered {
  background-color: var(--Schemes-Surface-Container-Low, #f5f5f5);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}

.location-card--selected {
  background-color: var(--Schemes-Surface-Container, #eee);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/LocationsPanel.vue
git commit -m "feat(ui): create LocationsPanel component with card list and interaction handling"
```

### Task 4: Update FinderView.vue to use LocationsPanel

**Files:**
- Modify: `packages/ui/src/views/FinderView.vue`

- [ ] **Step 1: Replace #location-list slot with LocationsPanel + #location-card slot**

In `packages/ui/src/views/FinderView.vue`:

1. Add import: `import LocationsPanel from '../components/LocationsPanel.vue'`
2. Replace the `<component>` block that renders `slots['location-list']` (the `v-else-if="loadedData && slots['location-list']"` block, around lines 61-71) with:

```vue
<LocationsPanel
  v-else-if="loadedData"
  :locations="loadedData"
  :hovered-id="hoveredId"
  :selected-id="selectedId"
  @select="(loc) => onSelect(loc, onClickOpen)"
  @hover="onHover"
  @hover-end="onHoverEnd"
>
  <template #location-card="cardProps">
    <component
      v-if="slots['location-card']"
      :is="() => slots['location-card']!(cardProps)"
    />
  </template>
</LocationsPanel>
```

- [ ] **Step 2: Update internal types in FinderView**

Also in FinderView.vue, update the refs and function signatures to use `Location` instead of `unknown`:

1. Add import: `import type { Location } from '../types'` (if not already imported via the other imports)
2. Change `const selectedLocation = ref<unknown | null>(null)` to `const selectedLocation = ref<Location | null>(null)`
3. Change `function onSelect(location: unknown, ...)` to `function onSelect(location: Location, ...)`

- [ ] **Step 3: Build packages/ui to verify**

Run: `cd packages/ui && pnpm build`
Expected: Clean build with no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/views/FinderView.vue
git commit -m "feat(ui): use LocationsPanel in FinderView, replace #location-list with #location-card"
```

## Chunk 2: oem-flood-finder Migration

### Task 5: Move transform into useLocations composable

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/composables/useLocations.ts`
- Modify: `apps/oem-flood-finder/frontend/src/types.ts`

- [ ] **Step 1: Update useLocations to return Location[]**

In `apps/oem-flood-finder/frontend/src/composables/useLocations.ts`:

1. Import `Location` type from the app's own types (it already has one that satisfies the framework interface).
2. After fetching data, transform `LocationDTO` to `Location[]` (move the logic from `LocationList.vue`'s `transformLocationDTO`).
3. Return `Location[]` in the loaded state instead of raw `LocationDTO`.

```ts
import type { LocationDTO, Location } from '@/types'
import { ref, onMounted, type Ref } from 'vue'
import type { State } from '@pinboard/ui'

function transformLocationDTO(dto: LocationDTO): Location[] {
  const locations: Location[] = []

  for (const gauge of dto.awareGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'AwareGauge', data: gauge },
    })
  }

  for (const gauge of dto.usgsGauges) {
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: { kind: 'UsgsGauge', data: gauge },
    })
  }

  for (const camera of dto.cameras) {
    locations.push({
      id: camera.cameraId,
      name: camera.name,
      latitude: camera.latitude,
      longitude: camera.longitude,
      lastUpdated: camera.lastUpdated,
      other: { kind: 'Camera', data: camera },
    })
  }

  return locations
}

export function useLocations(): Ref<State> {
  const state = ref<State>({ kind: 'Loading' })

  async function fetchLocations() {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      state.value = { kind: 'Error', message: 'Error retrieving gauges' }
      return
    }

    const data: LocationDTO = await response.json()
    state.value = { kind: 'Loaded', data: transformLocationDTO(data) }
  }

  onMounted(fetchLocations)
  return state
}
```

Note: The local `State` type alias can be removed since we now import from `@pinboard/ui`.

- [ ] **Step 2: Commit**

```bash
git add apps/oem-flood-finder/frontend/src/composables/useLocations.ts
git commit -m "refactor(oem-flood-finder): move DTO transform into useLocations, return Location[]"
```

### Task 6: Update App.vue slots and delete LocationList.vue

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/App.vue`
- Delete: `apps/oem-flood-finder/frontend/src/components/LocationList.vue`

- [ ] **Step 1: Replace #location-list with #location-card in App.vue**

In `apps/oem-flood-finder/frontend/src/App.vue`:

1. Remove `import LocationList from './components/LocationList.vue'`
2. Remove the `allGauges` and `gaugeToLocation` helper functions (no longer needed).
3. Replace the `#location-list` slot:

```vue
<!-- OLD -->
<template #location-list="{ locations, onSelect, hoveredId, onHover, onHoverEnd }">
  <LocationList ... />
</template>

<!-- NEW -->
<template #location-card="{ location }">
  {{ location.name }}
</template>
```

4. Update `#map-content` slot — `locations` is now `Location[]`, not `LocationDTO`:

```vue
<template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
  <MapMarker
    v-for="loc in locations"
    :key="loc.id"
    :lng-lat="[loc.longitude, loc.latitude]"
    :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
  >
    <MapIconTextPin
      :icon="faGauge"
      :text="loc.id.slice(0, 8)"
      color-theme="dark-primary"
      :hovered="hoveredId === loc.id"
      :selected="selectedId === loc.id"
      @mouseenter="onHover(loc.id)"
      @mouseleave="onHoverEnd()"
      @click="onSelect(loc)"
    />
  </MapMarker>
</template>
```

Note: `loc.longitude` and `loc.latitude` work because oem-flood-finder's `Location` type has these fields. Remove unused imports (`LocationDTO`, `Gauge`).

- [ ] **Step 2: Delete LocationList.vue**

Delete `apps/oem-flood-finder/frontend/src/components/LocationList.vue`.

- [ ] **Step 3: Remove @phila/phila-ui-cards from oem-flood-finder's dependencies**

In `apps/oem-flood-finder/frontend/package.json`, remove `"@phila/phila-ui-cards"` from `dependencies` (it's now in packages/ui).

- [ ] **Step 4: Build both packages**

Run: `cd packages/ui && pnpm build && cd ../../apps/oem-flood-finder/frontend && pnpm build`
Expected: Both build cleanly.

- [ ] **Step 5: Commit**

```bash
git add -A apps/oem-flood-finder/frontend/ packages/ui/
git commit -m "refactor(oem-flood-finder): migrate to #location-card slot, delete LocationList"
```

## Chunk 3: Scaffold primary-care-finder Frontend

### Task 7: Create package.json and Vite config

**Files:**
- Create: `apps/primary-care-finder/frontend/package.json`
- Create: `apps/primary-care-finder/frontend/vite.config.ts`
- Create: `apps/primary-care-finder/frontend/tsconfig.json`
- Create: `apps/primary-care-finder/frontend/tsconfig.app.json`
- Create: `apps/primary-care-finder/frontend/env.d.ts`

- [ ] **Step 1: Create frontend/package.json**

Model after oem-flood-finder's `frontend/package.json`. Key differences: name is `@pinboard/primary-care-finder`, add `vue-i18n` dependency, no flood API env vars needed.

```json
{
  "name": "@pinboard/primary-care-finder",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "run-p type-check \"build-only {@}\" --",
    "preview": "vite preview",
    "build-only": "vite build",
    "type-check": "vue-tsc --build"
  },
  "dependencies": {
    "@fortawesome/free-solid-svg-icons": "^7.1.0",
    "@phila/phila-ui-button": "^2.2.1",
    "@phila/phila-ui-map-core": "0.0.3-beta.14",
    "@pinboard/ui": "workspace:*",
    "date-fns": "^4.1.0",
    "vue": "^3.5.27",
    "vue-i18n": "^11.0.1",
    "vue-router": "^5.0.1"
  },
  "devDependencies": {
    "@tsconfig/node24": "^24.0.4",
    "@types/node": "^24.10.9",
    "@vitejs/plugin-vue": "^6.0.3",
    "@vue/tsconfig": "^0.8.1",
    "npm-run-all2": "^8.0.4",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vue-tsc": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create frontend/vite.config.ts**

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

- [ ] **Step 3: Create tsconfig files and env.d.ts**

Create `frontend/tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" }
  ]
}
```

Create `frontend/tsconfig.app.json`:
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"]
}
```

Create `frontend/env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 4: Create .env.development**

Create `frontend/.env.development`:
```
VITE_PUBLICPATH=/dev/primary-care/
```

- [ ] **Step 5: Install dependencies**

Run: `cd apps/primary-care-finder/frontend && pnpm install`

- [ ] **Step 6: Commit**

```bash
git add apps/primary-care-finder/frontend/
git commit -m "feat(primary-care-finder): scaffold frontend with package.json, vite, and tsconfig"
```

### Task 8: Create index.html

**Files:**
- Create: `apps/primary-care-finder/frontend/index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Primary Care Finder</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/index.html
git commit -m "feat(primary-care-finder): add index.html"
```

### Task 9: Set up i18n infrastructure

**Files:**
- Create: `apps/primary-care-finder/frontend/src/i18n/en.ts`
- Create: `apps/primary-care-finder/frontend/src/i18n/index.ts`

- [ ] **Step 1: Create en.ts**

Port the English translations from the original `src/i18n/en.js`. Convert to TypeScript export. This is a large file — copy the full content from the original at `c:\Users\andy.rothwell\Projects\primary-care-finder\src\i18n\en.js`, converting `export default{` to `export default {` and keeping the exact same structure.

The file contains keys for: `app`, `introPage`, `cards`, `service`, `slidingScale`, `ageSpecificServices`, `otherServices`, `ageRange`, `patientType`, `visitType`, `tests`, `languages`, `specialty`, `waitTime`, `transit`, `tooltips`, `warnings`, `exceptions`, `closed`, `slidingScaleExplanation`, `tableNoData`, and other UI strings.

- [ ] **Step 2: Create i18n/index.ts**

```ts
import { createI18n } from 'vue-i18n'
import en from './en'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
})

export default i18n
```

- [ ] **Step 3: Commit**

```bash
git add apps/primary-care-finder/frontend/src/i18n/
git commit -m "feat(primary-care-finder): set up vue-i18n with English translations"
```

## Chunk 4: Types and Data Fetching

### Task 10: Create types.ts

**Files:**
- Create: `apps/primary-care-finder/frontend/src/types.ts`

- [ ] **Step 1: Define PrimaryCareLocation type**

The ArcGIS endpoint returns GeoJSON features. Each feature has `properties` (flat object with all the fields) and `geometry` (GeoJSON point with `coordinates: [lng, lat]`). Define a type that extends the framework's `Location` contract:

```ts
import type { Location } from '@pinboard/ui'

export interface PrimaryCareLocation extends Location {
  properties: PrimaryCareProperties
  geometry: { type: 'Point'; coordinates: [number, number] }
}

export interface PrimaryCareProperties {
  OBJECTID: number
  record: string
  address: string
  address_2: string | null
  zip_code: string
  med_phone_num: string | null
  website: string | null
  language: string | null
  sliding_scale: string | null
  optional_info_general: string | null
  data_complete: string | null

  // Primary care services
  primary_well_ad: string | null
  primary_well_ch: string | null
  primary_sick_ad: string | null
  primary_sick_ch: string | null
  primary_vacc_ad: string | null
  primary_vacc_child: string | null
  primary_sports: string | null
  primary_prenatal: string | null
  primary_women: string | null
  primary_telehealth: string | null

  // Specialty services
  special_mental_ad: string | null
  special_mental_ch: string | null
  special_dental_ad: string | null
  special_dental_ch: string | null
  special_eye_ad: string | null
  special_eye_ch: string | null
  special_podiatry: string | null
  special_mat: string | null
  special_nutrition: string | null
  special_tobacco: string | null
  special_pharmacy: string | null

  // Wait times
  wait_sameday_sick_ch: string | null
  wait_sameday_sick_ad: string | null
  wait_week_well_ch: string | null
  wait_week_well_ad: string | null
  wait_week_sick_ch: string | null
  wait_week_sick_ad: string | null
  wait_2mo_ch: string | null
  wait_2mo_ad: string | null

  // Tests
  tests_blood: string | null
  tests_sti: string | null
  tests_covid: string | null
  tests_mammo: string | null
  tests_xray: string | null

  // Transit
  transport_bus: string | null
  transport_subway: string | null
  transport_train: string | null
  transport_trolley: string | null
  transport_parking: string | null

  // Hours (mon-sun: start, end, exceptions)
  hours_mon_start: string | null
  hours_mon_end: string | null
  hours_mon_exceptions: string | null
  hours_tues_start: string | null
  hours_tues_end: string | null
  hours_tues_exceptions: string | null
  hours_wed_start: string | null
  hours_wed_end: string | null
  hours_wed_exceptions: string | null
  hours_thurs_start: string | null
  hours_thurs_end: string | null
  hours_thurs_exceptions: string | null
  hours_fri_start: string | null
  hours_fri_end: string | null
  hours_fri_exceptions: string | null
  hours_sat_start: string | null
  hours_sat_end: string | null
  hours_sat_exceptions: string | null
  hours_sun_start: string | null
  hours_sun_end: string | null
  hours_sun_exceptions: string | null

  [key: string]: unknown
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/src/types.ts
git commit -m "feat(primary-care-finder): define PrimaryCareLocation and PrimaryCareProperties types"
```

### Task 11: Create useLocations composable

**Files:**
- Create: `apps/primary-care-finder/frontend/src/composables/useLocations.ts`

- [ ] **Step 1: Create the composable**

Fetches GeoJSON from ArcGIS, maps features to `PrimaryCareLocation[]`, applies hidden refinement filters:

```ts
import { ref, onMounted, type Ref } from 'vue'
import type { State } from '@pinboard/ui'
import type { PrimaryCareLocation } from '@/types'

const ARCGIS_URL = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query'

function isVisible(feature: PrimaryCareLocation): boolean {
  const props = feature.properties

  // Exclude incomplete records
  if (props.data_complete !== '2') return false

  // Exclude test records
  if (['3', '5', '6', '7', '8', '9'].includes(props.record)) return false

  // Exclude test addresses
  if (props.address === 'Test') return false

  return true
}

export function useLocations(): Ref<State> {
  const state = ref<State>({ kind: 'Loading' })

  async function fetchLocations() {
    try {
      const params = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
      })

      const response = await fetch(`${ARCGIS_URL}?${params}`)

      if (!response.ok) {
        state.value = { kind: 'Error', message: 'Error retrieving primary care sites' }
        return
      }

      const geojson = await response.json()
      const locations: PrimaryCareLocation[] = geojson.features
        .map((feature: any) => ({
          id: String(feature.properties.OBJECTID),
          properties: feature.properties,
          geometry: feature.geometry,
        }))
        .filter(isVisible)

      state.value = { kind: 'Loaded', data: locations }
    } catch {
      state.value = { kind: 'Error', message: 'Error retrieving primary care sites' }
    }
  }

  onMounted(fetchLocations)
  return state
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/src/composables/useLocations.ts
git commit -m "feat(primary-care-finder): create useLocations composable with hidden refinement"
```

### Task 12: Create main.ts

**Files:**
- Create: `apps/primary-care-finder/frontend/src/main.ts`

- [ ] **Step 1: Create main.ts**

```ts
import { createApp } from 'vue'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import i18n from './i18n'
import { useLocations } from './composables/useLocations'

const app = createApp(App)

app.use(i18n)
app.use(createPinboard({
  title: 'Primary Care Finder',
  useLocations: () => useLocations(),
  map: {
    center: [-75.16, 39.95],
    zoom: 12,
  },
}))

app.mount('#app')
```

Note: No separate router setup is needed — `createPinboard` installs vue-router internally (see `packages/ui/src/plugin.ts`). The app's components can use `useRouter()` because the plugin provides it.

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/src/main.ts
git commit -m "feat(primary-care-finder): create main.ts with createPinboard and i18n"
```

## Chunk 5: App Components

### Task 13: Create HomeContent.vue

**Files:**
- Create: `apps/primary-care-finder/frontend/src/components/HomeContent.vue`

- [ ] **Step 1: Create the component**

Port from the original `customGreeting.vue`. Use `$t()` for all strings. Remove the old pinboard store dependency. Use `useRouter` for navigation instead of emits.

```vue
<script setup lang="ts">
import { PhilaButton } from '@phila/phila-ui-button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="home-content">
    <section class="intro">
      <h2>{{ $t('introPage.section1Title') }}</h2>
      <p v-html="$t('introPage.p0')" />

      <div class="intro-actions">
        <PhilaButton :text="$t('app.viewList')" @click="router.push('/finder')" />
      </div>

      <p v-html="$t('introPage.p05')" />
      <p v-html="$t('introPage.p1')" />
      <ol>
        <li>{{ $t('introPage.ol1.li1') }}</li>
        <li>{{ $t('introPage.ol1.li2') }}</li>
        <li>{{ $t('introPage.ol1.li3') }}</li>
      </ol>
    </section>

    <section>
      <h2>{{ $t('introPage.section2Title') }}</h2>
      <p v-html="$t('introPage.p2')" />
    </section>

    <section>
      <h2>{{ $t('introPage.section25Title') }}</h2>
      <p v-html="$t('introPage.p25')" />
    </section>

    <section>
      <h2>{{ $t('introPage.section3Title') }}</h2>
      <p>{{ $t('introPage.p3') }}</p>
    </section>

    <section>
      <h2>{{ $t('introPage.section4Title') }}</h2>
      <p>{{ $t('introPage.p4') }}</p>
    </section>

    <section>
      <h2>{{ $t('introPage.section5Title') }}</h2>
      <p>
        {{ $t('introPage.p5') }}
        <a target="_blank" href="https://www.phila.gov/departments/department-of-public-health/about-us/contact-us/#send-us-a-message">
          {{ $t('introPage.feedbackForm') }}
        </a>.
      </p>
    </section>
  </div>
</template>

<style scoped>
.home-content {
  max-width: 50rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.intro-actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}
</style>
```

Note: The original `customGreeting.vue` also had a "View Map" button shown on mobile (`v-if="isMobile"`). We can add responsive behavior later. Also, the original emitted `view-list` and `view-map` events to the parent framework — we handle navigation directly via the router now.

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/src/components/HomeContent.vue
git commit -m "feat(primary-care-finder): create HomeContent component with intro page"
```

### Task 14: Create LocationCard.vue

**Files:**
- Create: `apps/primary-care-finder/frontend/src/components/LocationCard.vue`

- [ ] **Step 1: Create the component**

This renders the card content for a single location in the list. Shows name, address, and phone. The original pinboard showed the site name via `locationInfo.siteName()`.

```vue
<script setup lang="ts">
import type { PrimaryCareLocation } from '@/types'

const props = defineProps<{
  location: PrimaryCareLocation
}>()

function siteName(location: PrimaryCareLocation): string {
  let value = location.properties.record
  if (value === 'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center') {
    value = "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center"
  }
  return value
}
</script>

<template>
  <div class="location-card-content">
    <strong>{{ siteName(location) }}</strong>
    <div v-if="location.properties.address" class="card-address">
      {{ location.properties.address }}
    </div>
    <div v-if="location.properties.med_phone_num" class="card-phone">
      {{ location.properties.med_phone_num }}
    </div>
  </div>
</template>

<style scoped>
.location-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-address,
.card-phone {
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #666);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/src/components/LocationCard.vue
git commit -m "feat(primary-care-finder): create LocationCard component"
```

### Task 15: Create LocationDetail.vue

**Files:**
- Create: `apps/primary-care-finder/frontend/src/components/LocationDetail.vue`

- [ ] **Step 1: Create the component**

Port from the original `ExpandCollapseContent.vue`. This is the largest component. Convert from vue-good-table to plain HTML tables. Remove old pinboard store and config dependencies. Use `useI18n` composable directly.

Key sections to port:
- Address, phone, website
- Transit information
- Languages spoken
- Age-specific services table
- Other services table
- Hours table with exceptions
- Tests list
- Sliding scale

The component receives `location: PrimaryCareLocation` and `onClose: Function` as props.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { useI18n } from 'vue-i18n'
import type { PrimaryCareLocation } from '@/types'

const props = defineProps<{
  location: PrimaryCareLocation
  onClose: (e: MouseEvent) => void
}>()

const { t, locale, messages } = useI18n()

const p = computed(() => props.location.properties)

const fullAddress = computed(() => {
  let addr = p.value.address
  if (p.value.address_2) addr += ', ' + p.value.address_2
  addr += ', Philadelphia, PA ' + p.value.zip_code
  return addr
})

function siteName(): string {
  let value = p.value.record
  if (value === 'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center') {
    value = "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center"
  }
  return value
}

// --- Age-specific services ---
interface ServiceRow {
  id: number
  service: string
  adult: string | null
  child: string | null
  existing: (string | null)[]
}

const YES_VALUES = ['Yes', 'Established Patients']

const ageSpecificServices = computed<ServiceRow[]>(() => {
  const rows: ServiceRow[] = []
  const checks: [string, string, string][] = [
    ['visitType.well', 'primary_well_ad', 'primary_well_ch'],
    ['visitType.sick', 'primary_sick_ad', 'primary_sick_ch'],
    ['visitType.vaccine', 'primary_vacc_ad', 'primary_vacc_child'],
    ['specialty.mental', 'special_mental_ad', 'special_mental_ch'],
    ['specialty.dental', 'special_dental_ad', 'special_dental_ch'],
    ['specialty.eye', 'special_eye_ad', 'special_eye_ch'],
  ]
  let id = 1
  for (const [service, adultField, childField] of checks) {
    const adult = p.value[adultField] as string | null
    const child = p.value[childField] as string | null
    if (YES_VALUES.includes(adult ?? '') || YES_VALUES.includes(child ?? '')) {
      rows.push({ id: id++, service, adult, child, existing: [adult, child] })
    }
  }
  return rows
})

// --- Other services ---
interface OtherServiceRow {
  id: number
  service: string
  value: string | null
}

const otherServices = computed<OtherServiceRow[]>(() => {
  const rows: OtherServiceRow[] = []
  const checks: [string, string][] = [
    ['visitType.sports', 'primary_sports'],
    ['visitType.prenatal', 'primary_prenatal'],
    ['visitType.women', 'primary_women'],
    ['specialty.mat', 'special_mat'],
    ['specialty.podiatry', 'special_podiatry'],
    ['specialty.nutrition', 'special_nutrition'],
    ['specialty.tobacco', 'special_tobacco'],
    ['visitType.telehealth', 'primary_telehealth'],
    ['specialty.pharmacy', 'special_pharmacy'],
  ]
  let id = 1
  for (const [service, field] of checks) {
    const val = p.value[field] as string | null
    if (YES_VALUES.includes(val ?? '')) {
      rows.push({ id: id++, service, value: val })
    }
  }
  return rows
})

// --- Hours ---
const DAYS = ['mon', 'tues', 'wed', 'thurs', 'fri', 'sat', 'sun'] as const
const DAY_I18N_KEYS: Record<string, string> = {
  mon: 'Monday', tues: 'Tuesday', wed: 'Wednesday', thurs: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

const exceptionsByDay = computed(() => {
  const result: Record<string, string> = {}
  for (const day of DAYS) {
    const exc = p.value[`hours_${day}_exceptions`] as string | null
    if (exc) result[day] = exc
  }
  return result
})

const exceptionsList = computed(() => {
  const arr: string[] = []
  for (const day of DAYS) {
    const exc = p.value[`hours_${day}_exceptions`] as string | null
    if (exc) arr.push(exc)
  }
  return [...new Set(arr)]
})

function parseTime(raw: string | null): string {
  if (!raw) return ''
  return format(parseISO('2022-05-24T' + raw), 'h:mm aaaa')
}

function exceptionCounter(day: string): number | null {
  const exc = exceptionsByDay.value[day]
  if (!exc) return null
  return 1 + exceptionsList.value.indexOf(exc)
}

function parseTimeRange(day: string): string {
  const start = p.value[`hours_${day}_start`] as string | null
  const end = p.value[`hours_${day}_end`] as string | null
  const counter = exceptionCounter(day)
  let val: string
  if (start && end) {
    val = parseTime(start) + ' - ' + parseTime(end)
  } else {
    val = t('closed')
  }
  if (counter) val += '*'.repeat(counter)
  return val
}

function parseException(exception: string, index: number): string {
  const stars = '*'.repeat(index)
  const msgs = messages.value[locale.value] as any
  const translated = msgs?.exceptions?.[exception]
  return stars + ' ' + (translated ?? exception)
}

// --- Tests ---
const tests = computed(() => {
  const fields = ['blood', 'sti', 'covid', 'mammo', 'xray']
  return fields.filter(f => p.value[`tests_${f}`] === 'Yes')
})

// --- Languages ---
const languagesSpoken = computed<string[]>(() => {
  if (!p.value.language) return []
  return p.value.language.split(',').map(s => s.trim())
})

function translateLanguage(lang: string): string {
  const msgs = messages.value[locale.value] as any
  return msgs?.languages?.[lang.toLowerCase()] ?? lang
}

function translateWarning(warning: string): string {
  const msgs = messages.value[locale.value] as any
  return msgs?.warnings?.[warning] ?? warning
}

// --- Transit helpers ---
function translateTransitList(raw: string | null, category: string): string {
  if (!raw) return ''
  const msgs = messages.value[locale.value] as any
  const translations = msgs?.transit?.[category]
  return raw.split(',').map(s => {
    const key = s.trim()
    return translations?.[key] ?? key
  }).join(', ')
}
</script>

<template>
  <div class="location-detail">
    <div class="detail-header">
      <h2>{{ siteName() }}</h2>
      <button class="close-button" @click="onClose">&#x2715;</button>
    </div>

    <div class="detail-body">
      <!-- Warning callout -->
      <div v-if="p.optional_info_general" class="warning-callout">
        {{ translateWarning(p.optional_info_general) }}
      </div>

      <!-- Contact info -->
      <section class="contact-section">
        <div v-if="p.address" class="contact-row">
          <span class="contact-label">{{ fullAddress }}</span>
        </div>
        <div v-if="p.website" class="contact-row">
          <a :href="p.website" target="_blank">{{ p.website }}</a>
        </div>
        <div v-if="p.med_phone_num" class="contact-row">
          {{ p.med_phone_num }}
        </div>
      </section>

      <!-- Transit -->
      <section v-if="p.transport_bus || p.transport_subway || p.transport_train || p.transport_trolley || p.transport_parking" class="transit-section">
        <div v-if="p.transport_bus">
          <strong>{{ $t('transit.bus') }}:</strong> {{ p.transport_bus }}
        </div>
        <div v-if="p.transport_subway">
          <strong>{{ $t('transit.subway.label') }}:</strong> {{ translateTransitList(p.transport_subway, 'subway') }}
        </div>
        <div v-if="p.transport_train">
          <strong>{{ $t('transit.regRail.label') }}:</strong> {{ translateTransitList(p.transport_train, 'regRail') }}
        </div>
        <div v-if="p.transport_trolley">
          <strong>{{ $t('transit.trolley') }}:</strong> {{ p.transport_trolley }}
        </div>
        <div v-if="p.transport_parking">
          <strong>{{ $t('transit.car.label') }}:</strong> {{ translateTransitList(p.transport_parking, 'car') }}
        </div>
      </section>

      <!-- Languages -->
      <section v-if="languagesSpoken.length">
        <strong>{{ $t('languagesSpoken') }}:</strong>
        {{ languagesSpoken.map(translateLanguage).join(', ') }}
      </section>

      <!-- Age-specific services table -->
      <section>
        <h3>{{ $t('ageSpecificServices') }}</h3>
        <p>{{ $t('cards.table1Intro') }}</p>
        <table v-if="ageSpecificServices.length" class="data-table">
          <thead>
            <tr>
              <th>{{ $t('service') }}</th>
              <th class="center">{{ $t('ageRange.adult') }}</th>
              <th class="center">{{ $t('ageRange.child') }}</th>
              <th class="center">{{ $t('patientType.patient_type_existing_only') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ageSpecificServices" :key="row.id">
              <td>{{ $t(row.service) }}</td>
              <td class="center">{{ YES_VALUES.includes(row.adult ?? '') ? '✓' : '' }}</td>
              <td class="center">{{ YES_VALUES.includes(row.child ?? '') ? '✓' : '' }}</td>
              <td class="center">{{ row.existing.includes('Established Patients') ? '✓' : '' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>{{ $t('tableNoData.noSpecializedServices') }}</p>
      </section>

      <!-- Other services table -->
      <section>
        <h3>{{ $t('otherServices') }}</h3>
        <p>{{ $t('cards.table2Intro') }}</p>
        <table v-if="otherServices.length" class="data-table">
          <thead>
            <tr>
              <th>{{ $t('service') }}</th>
              <th class="center">{{ $t('patientType.patient_type_new') }}</th>
              <th class="center">{{ $t('patientType.patient_type_existing') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in otherServices" :key="row.id">
              <td>{{ $t(row.service) }}</td>
              <td class="center">{{ row.value === 'Yes' ? '✓' : '' }}</td>
              <td class="center">{{ YES_VALUES.includes(row.value ?? '') ? '✓' : '' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>{{ $t('tableNoData.noOtherServices') }}</p>
      </section>

      <!-- Hours table -->
      <section>
        <h3>{{ $t('hours') }}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('daysOfTheWeek') }}</th>
              <th>{{ $t('schedule') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in DAYS" :key="day">
              <td>{{ $t(DAY_I18N_KEYS[day]) }}</td>
              <td>{{ parseTimeRange(day) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="exceptionsList.length" class="exceptions">
          <div v-for="(exc, i) in exceptionsList" :key="i">
            {{ parseException(exc, i + 1) }}
          </div>
        </div>
      </section>

      <!-- Tests -->
      <section>
        <h3>{{ $t('tests.category') }}</h3>
        <ul v-if="tests.length">
          <li v-for="test in tests" :key="test">{{ $t(`tests.${test}`) }}</li>
        </ul>
        <p v-else>{{ $t('tests.noTests') }}</p>
      </section>

      <!-- Sliding scale -->
      <section>
        <h3>{{ $t('slidingScale') }}</h3>
        <p>{{ $t('slidingScaleExplanation') }}</p>
        <p>{{ p.sliding_scale ?? $t('slidingScaleNull') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #ccc;
}

.detail-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.warning-callout {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem 1rem;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transit-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.center {
  text-align: center;
}

.exceptions {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}
</style>
```

Note: Some i18n keys (`hours`, `daysOfTheWeek`, `schedule`, `languagesSpoken`) need to exist in `en.ts`. If the original `en.js` doesn't have them as top-level keys, add them. Check and add any missing keys during implementation.

- [ ] **Step 2: Commit**

```bash
git add apps/primary-care-finder/frontend/src/components/LocationDetail.vue
git commit -m "feat(primary-care-finder): create LocationDetail with services, hours, transit, tests"
```

### Task 16: Create App.vue

**Files:**
- Create: `apps/primary-care-finder/frontend/src/App.vue`

- [ ] **Step 1: Create the root component with all slots**

```vue
<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import { MapMarker } from '@phila/phila-ui-map-core'
import HomeContent from './components/HomeContent.vue'
import LocationCard from './components/LocationCard.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { PrimaryCareLocation } from './types'
</script>

<template>
  <Pinboard>
    <template #home>
      <HomeContent />
    </template>

    <template #location-card="{ location }">
      <LocationCard :location="location as PrimaryCareLocation" />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location as PrimaryCareLocation"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-for="loc in (locations as PrimaryCareLocation[])"
        :key="loc.id"
        :lng-lat="[loc.geometry.coordinates[0], loc.geometry.coordinates[1]]"
        :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
      >
        <div
          class="map-pin"
          :class="{
            'map-pin--hovered': hoveredId === loc.id,
            'map-pin--selected': selectedId === loc.id,
          }"
          @mouseenter="onHover(loc.id)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(loc)"
        />
      </MapMarker>
    </template>
  </Pinboard>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.map-pin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #2176d2;
  border: 1px solid white;
  cursor: pointer;
}

.map-pin--hovered {
  background-color: #0d47a1;
  transform: scale(1.3);
}

.map-pin--selected {
  background-color: #0d47a1;
  border: 2px solid white;
  transform: scale(1.5);
}
</style>
```

Note: The original app used a circle map layer (`circle-radius: 7, circle-color: #2176d2`). We replicate this with a simple CSS circle div inside a MapMarker. If `MapIconTextPin` is needed later, it can be swapped in. The map-core CSS import is required to prevent the map from panning continuously.

- [ ] **Step 2: Verify build**

Run: `cd apps/primary-care-finder/frontend && pnpm build`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add apps/primary-care-finder/frontend/src/App.vue
git commit -m "feat(primary-care-finder): create App.vue with all slot implementations"
```

## Chunk 6: Verification and Cleanup

### Task 17: Add missing i18n keys

**Files:**
- Modify: `apps/primary-care-finder/frontend/src/i18n/en.ts`

- [ ] **Step 1: Add missing i18n keys to en.ts**

The original `en.js` does not contain these keys (they were provided by the old pinboard framework). Add them to `en.ts`:

```ts
"hours": "Hours",
"daysOfTheWeek": "Day",
"schedule": "Schedule",
"languagesSpoken": "Languages spoken",
"english": "English",
"noInfo": "No information available",
"Monday": "Monday",
"Tuesday": "Tuesday",
"Wednesday": "Wednesday",
"Thursday": "Thursday",
"Friday": "Friday",
"Saturday": "Saturday",
"Sunday": "Sunday",
"app": {
  ...existing app keys...,
  "viewList": "View list",
  "viewMap": "View map"
}
```

Note: vue-i18n returns the key string on miss (not null/undefined), so `$t('hours')` would render literally as "hours" if missing. All keys used in templates MUST exist in the messages.

- [ ] **Step 2: Commit if changes made**

```bash
git add apps/primary-care-finder/frontend/src/i18n/en.ts
git commit -m "feat(primary-care-finder): add missing i18n keys"
```

### Task 18: Full build verification

- [ ] **Step 1: Build packages/ui**

Run: `cd packages/ui && pnpm build`
Expected: Clean build.

- [ ] **Step 2: Build oem-flood-finder**

Run: `cd apps/oem-flood-finder/frontend && pnpm build`
Expected: Clean build.

- [ ] **Step 3: Build primary-care-finder**

Run: `cd apps/primary-care-finder/frontend && pnpm build`
Expected: Clean build.

- [ ] **Step 4: Commit any fixes needed**

If any build errors are found, fix them and commit.

### Task 19: Final commit and summary

- [ ] **Step 1: Verify git status is clean**

Run: `git status`
Expected: Clean working tree (or only untracked files like node_modules).

- [ ] **Step 2: Push branch**

Run: `git push origin feat/refactor-component-locations`
