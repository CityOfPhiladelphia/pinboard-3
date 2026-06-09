# Philly 311 — Slice 2a: Core Reports Finder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/` into the `Pinboard` map + list finder for nearby 311 reports, with single-select service-type filter chips, geolocation-seeded **load-once**, and an inline report-detail panel. (Reload-on-pan is slice 2a.1 — it needs a separate `@pinboard/ui` enhancement to expose the map instance.)

**Architecture:** Mirror `apps/oem-flood-finder`'s `FinderView`. A tested `useReportFinder` composable owns region/loading/filter and exposes `BasicLocation[]` mapped from `Report`s (pure `reportCard`) plus `reportById`. `pages/LandingPage.vue` binds it to `<Pinboard>` and renders map pins (`MapIconTextPin`, icon from pure `reportIcon`) + an inline `ReportDetail`.

**Tech Stack:** Vue 3.5, `@pinboard/ui` (`Pinboard`/`MapMarker`/`MapIconTextPin`/controls), `@phila/phila-ui-cards` (`MapCardProps`), `@fortawesome/pro-solid-svg-icons`, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-09-philly-311-reports-finder-design.md`

**Conventions for every task:**
- All paths relative to `pinboard-3/` root. Work on branch `feat/philly-311-reports-finder` (already created).
- `APP` = `apps/philly-311/frontend`. Run filtered: `pnpm --filter @pinboard/philly-311 <script>`.
- Prettier `semi: false, singleQuote: true, printWidth: 100`. Run `pnpm --filter @pinboard/philly-311 format` before each commit.
- Each task: failing test → run (fails) → implement → run (passes) → `type-check` + `lint` → commit. Keep `test:run` fully green at every commit.
- **Scope:** only create/modify files under `APP/src` (+ `APP/package.json`). Do NOT touch `@pinboard/ui` or other apps. If type-check surfaces an error in `@pinboard/ui` source, STOP and report BLOCKED.

**Reference files to read first (read-only patterns):**
- `apps/oem-flood-finder/frontend/src/views/FinderView.vue` — `<Pinboard>` usage, `#map-content` (markers + `MapNavigationControl`/`GeolocationButton`/`BasemapToggle`), `#location-detail`.
- `apps/oem-flood-finder/frontend/src/composables/useLocations.ts` — `MapCardProps` construction (`heading`/`subheader`/`tags`/`src`), `getLocationTags` (`{ text, color, iconDefinition }`).
- `apps/oem-flood-finder/frontend/src/components/LocationDetail.vue` — detail-slot shape (`CloseButton`, scoped styles).

**Known API facts (from the foundation / shared package):**
- `useNearbyReports()` → `{ reports, isLoading, error, load(region: { lat, lng, radius? }): Promise<Report[]> }`. `Report` = `{ id, caseNumber, lat, lng, serviceType, status, address, department?, mediaUrl?, description?, distance(meters), createdAt?, updatedAt? }`.
- `getCurrentPosition(): Promise<{ lat, lng } | null>` from `@/composables/useGeolocation`.
- `formatDistance(meters): string | null` from `@/utils/distance`.
- `common_categories.json` = `[{ slug, title, iconName }]` (10 entries; `iconName` is an FA name string; `title` is the full service-type display name, e.g. "Pothole Repair").
- `MapCardProps` = `{ heading?, subheader?, tags?: TagsProps[], body?, src?, alt?, href? }`. `TagsProps.color` ∈ `'blue'|'grey'|'green'|'orange'|'purple'|'red'|'white'|'yellow'`.
- **`BasicLocation` and `LatLon` are exported under the `PinboardTypes` namespace** — use `PinboardTypes.BasicLocation` / `PinboardTypes.LatLon` (there is NO top-level `BasicLocation` export). `BasicLocation` = `{ id, name, latitude, longitude, locationCardInfo: MapCardProps }`.
- `<Pinboard>` required props: `locations`, `searchOrUserLocation: LatLon`, `isLoading`, `errorMessage`; optional `locationPanelFilter: { value, label }[]`. Emits `selectedLocationsFilter`. Slots: `location-detail({ location, onClose })`, `map-content({ map, zoom, isMobile, hoveredId, selectedId, mobileControlsTarget, mobileControlsTargetLeft, onHover, onHoverEnd, onSelect })`. NOTE: the slot's `map` is currently always `null` — do NOT rely on it in this slice.
- `MapIconTextPin` (verify exact props against `FinderView.vue`): `:zoom`, `:icon` (FA `IconDefinition`), `color-theme` (enum, e.g. `light-primary` / `light-purple` — confirm valid values), `:hovered`, `:selected`, optional `:text`/`:visited`, `@mouseenter/@mouseleave/@click`.

---

## Task 1: `reportIcon` — service type → Fontawesome pin icon

**Files:**
- Modify: `APP/package.json` (add `@fortawesome/pro-solid-svg-icons`)
- Create: `APP/src/utils/reportIcon.ts`
- Test: `APP/src/utils/reportIcon.test.ts`

- [ ] **Step 1: Add the dependency.** In `APP/package.json` dependencies add `"@fortawesome/pro-solid-svg-icons": "^7.2.0"` (oem's version). From repo root run `pnpm install` (prefix `NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A` if it errors against the fontawesome registry).

- [ ] **Step 2: Write the failing test** (`reportIcon.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { faRoad, faDumpster, faLocationDot } from '@fortawesome/pro-solid-svg-icons'
import { serviceTypeIconDefinition } from './reportIcon'

describe('serviceTypeIconDefinition', () => {
  it('maps a known common-category service type to its FA icon', () => {
    expect(serviceTypeIconDefinition('Pothole Repair')).toBe(faRoad)
    expect(serviceTypeIconDefinition('Illegal Dumping')).toBe(faDumpster)
  })
  it('falls back to a neutral pin icon for unknown / missing types', () => {
    expect(serviceTypeIconDefinition('Some Unmapped Type')).toBe(faLocationDot)
    expect(serviceTypeIconDefinition(undefined)).toBe(faLocationDot)
  })
})
```

- [ ] **Step 3: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/utils/reportIcon`

- [ ] **Step 4: Implement** (`reportIcon.ts`)

```ts
// ABOUTME: Resolve a 311 service type to a Fontawesome pin icon via common_categories;
// ABOUTME: neutral location-dot fallback for any unmapped or missing service type.
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faRoad, faDumpster, faLightbulb, faSprayCan, faCar,
  faTrash, faRecycle, faTree, faPersonWalking, faWater, faLocationDot,
} from '@fortawesome/pro-solid-svg-icons'
import commonCategories from '@/data/common_categories.json'

const ICONS: Record<string, IconDefinition> = {
  road: faRoad, dumpster: faDumpster, lightbulb: faLightbulb, 'spray-can': faSprayCan,
  car: faCar, trash: faTrash, recycle: faRecycle, tree: faTree,
  'person-walking': faPersonWalking, water: faWater,
}

// full service-type display name (common_categories.title) -> FA icon
const BY_TITLE: Record<string, IconDefinition> = Object.fromEntries(
  commonCategories
    .map((c) => [c.title, ICONS[c.iconName]] as const)
    .filter((e): e is [string, IconDefinition] => e[1] !== undefined),
)

export function serviceTypeIconDefinition(serviceType: string | undefined | null): IconDefinition {
  if (!serviceType) return faLocationDot
  return BY_TITLE[serviceType] ?? faLocationDot
}
```

- [ ] **Step 5: Run — expect PASS**, then `type-check`, `lint`, `format`.
- [ ] **Step 6: Commit**

```bash
git add apps/philly-311/frontend/package.json apps/philly-311/frontend/src/utils/reportIcon.ts apps/philly-311/frontend/src/utils/reportIcon.test.ts pnpm-lock.yaml
git commit -m "feat(philly-311): reportIcon — service type to FA pin icon"
```

---

## Task 2: `reportCard` — Report → BasicLocation (MapCardProps)

**Files:**
- Create: `APP/src/utils/reportCard.ts`
- Test: `APP/src/utils/reportCard.test.ts`

Maps a `Report` to a `PinboardTypes.BasicLocation` whose `locationCardInfo` is a `MapCardProps`:
`heading` = service type, `subheader` = address, `src` = `mediaUrl`, `tags` = `[statusTag]` + a grey distance tag when distance is present. Status → `TagColor` (default grey).

- [ ] **Step 1: Write the failing test** (`reportCard.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { reportToLocation, statusTagColor } from './reportCard'
import type { Report } from '@/composables/useNearbyReports'

const base: Report = {
  id: '12345678', caseNumber: '12345678', lat: 39.95, lng: -75.16,
  serviceType: 'Pothole Repair', status: 'In Progress', address: '1234 Market St',
  mediaUrl: 'https://example.test/p.jpg', description: 'big pothole', distance: 160,
}

describe('reportToLocation', () => {
  it('maps Report fields onto BasicLocation + MapCardProps', () => {
    const loc = reportToLocation(base)
    expect(loc.id).toBe('12345678')
    expect(loc.latitude).toBe(39.95)
    expect(loc.longitude).toBe(-75.16)
    expect(loc.locationCardInfo.heading).toBe('Pothole Repair')
    expect(loc.locationCardInfo.subheader).toBe('1234 Market St')
    expect(loc.locationCardInfo.src).toBe('https://example.test/p.jpg')
    const tags = loc.locationCardInfo.tags ?? []
    expect(tags[0]?.text).toBe('In Progress')
    expect(tags.some((t) => t.text === '0.1 mi')).toBe(true)
  })
  it('omits the distance tag when distance is missing', () => {
    const tags = reportToLocation({ ...base, distance: NaN }).locationCardInfo.tags ?? []
    expect(tags.some((t) => t.text?.endsWith('mi') || t.text?.endsWith('ft'))).toBe(false)
  })
})

describe('statusTagColor', () => {
  it('maps known statuses and defaults to grey', () => {
    expect(statusTagColor('In Progress')).toBe('purple')
    expect(statusTagColor('Closed')).toBe('green')
    expect(statusTagColor('whatever')).toBe('grey')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/utils/reportCard`

- [ ] **Step 3: Implement** (`reportCard.ts`)

```ts
// ABOUTME: Map a 311 Report to a Pinboard BasicLocation whose card (MapCardProps) drives
// ABOUTME: the left-panel list row: service type, address, status + distance tags.
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { TagsProps } from '@phila/phila-ui-tags'
import type { PinboardTypes } from '@pinboard/ui'
import type { Report } from '@/composables/useNearbyReports'
import { formatDistance } from '@/utils/distance'

type TagColor = NonNullable<TagsProps['color']>

const STATUS_COLORS: Record<string, TagColor> = {
  New: 'blue', Open: 'blue', 'In Progress': 'purple', Closed: 'green', Resolved: 'green',
}

export function statusTagColor(status: string | undefined | null): TagColor {
  if (!status) return 'grey'
  return STATUS_COLORS[status] ?? 'grey'
}

export function reportToLocation(report: Report): PinboardTypes.BasicLocation {
  const tags: TagsProps[] = []
  if (report.status) tags.push({ text: report.status, color: statusTagColor(report.status) })
  const distance = formatDistance(report.distance)
  if (distance) tags.push({ text: distance, color: 'grey' })

  const card: MapCardProps = {
    heading: report.serviceType,
    subheader: report.address,
    src: report.mediaUrl,
    tags,
  }

  return {
    id: report.id,
    name: report.serviceType,
    latitude: report.lat,
    longitude: report.lng,
    locationCardInfo: card,
  }
}
```
> `MapCardProps` has no icon field, so the Figma's per-row glyph isn't shown this slice (a `LocationsPanel` card slot in `@pinboard/ui` would be needed — deferred).

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/utils/reportCard.ts apps/philly-311/frontend/src/utils/reportCard.test.ts
git commit -m "feat(philly-311): reportCard — Report to BasicLocation/MapCardProps"
```

---

## Task 3: `useReportFinder` — finder state composable

**Files:**
- Create: `APP/src/composables/useReportFinder.ts`
- Test: `APP/src/composables/useReportFinder.test.ts`

Owns region (geolocation seed + default, **load-once**), category filter, loading/error, derived `locations`, `searchOrUserLocation`, and `reportById`. Default center `{ lat: 39.9526, lng: -75.1652 }`, radius `1600`.

Interface:
```ts
export interface UseReportFinder {
  locations: ComputedRef<PinboardTypes.BasicLocation[]>
  searchOrUserLocation: Ref<PinboardTypes.LatLon>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>            // 'all' or a service-type title
  init: () => Promise<void>      // onMounted: geolocate (or default) then load once
  setFilter: (value: string) => void
  reportById: (id: string) => Report | undefined
}
```

- [ ] **Step 1: Write the failing test** (`useReportFinder.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Report } from '@/composables/useNearbyReports'

const load = vi.fn()
const reportsRef = { value: [] as Report[] }
const isLoadingRef = { value: false }
const errorRef = { value: null as Error | null }
vi.mock('@/composables/useNearbyReports', () => ({
  useNearbyReports: () => ({ reports: reportsRef, isLoading: isLoadingRef, error: errorRef, load }),
}))
// inner arrow is called at test time, after the outer vi.fn is defined (vi.mock is hoisted)
const getCurrentPosition = vi.fn()
vi.mock('@/composables/useGeolocation', () => ({ getCurrentPosition: () => getCurrentPosition() }))

import { useReportFinder } from './useReportFinder'

const sample: Report = {
  id: '1', caseNumber: '1', lat: 39.95, lng: -75.16, serviceType: 'Pothole Repair',
  status: 'Open', address: 'A St', distance: 100,
}
const other: Report = { ...sample, id: '2', serviceType: 'Illegal Dumping' }

beforeEach(() => {
  load.mockReset().mockResolvedValue([sample, other])
  reportsRef.value = [sample, other]
  errorRef.value = null
  getCurrentPosition.mockReset()
})

describe('useReportFinder', () => {
  it('seeds region from geolocation and loads once', async () => {
    getCurrentPosition.mockResolvedValue({ lat: 40, lng: -75 })
    const f = useReportFinder()
    await f.init()
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 40, lng: -75 }))
    expect(f.searchOrUserLocation.value).toEqual({ latitude: 40, longitude: -75 })
    expect(f.locations.value).toHaveLength(2)
  })
  it('falls back to the default Philly center when geolocation is null', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ lat: 39.9526, lng: -75.1652 }))
  })
  it('filters locations by selected service type', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    f.setFilter('Pothole Repair')
    expect(f.locations.value.map((l) => l.id)).toEqual(['1'])
    f.setFilter('all')
    expect(f.locations.value).toHaveLength(2)
  })
  it('looks up a report by id', async () => {
    getCurrentPosition.mockResolvedValue(null)
    const f = useReportFinder()
    await f.init()
    expect(f.reportById('2')?.serviceType).toBe('Illegal Dumping')
  })
  it('exposes the load error message', async () => {
    getCurrentPosition.mockResolvedValue(null)
    errorRef.value = new Error('boom')
    const f = useReportFinder()
    await f.init()
    expect(f.errorMessage.value).toBe('boom')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/composables/useReportFinder`

- [ ] **Step 3: Implement** (`useReportFinder.ts`)

```ts
// ABOUTME: Finder state for the reports landing — seeds the nearby region (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: BasicLocation list + reportById lookup the Pinboard view binds.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { PinboardTypes } from '@pinboard/ui'
import { useNearbyReports, type Report } from '@/composables/useNearbyReports'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { reportToLocation } from '@/utils/reportCard'

const DEFAULT_CENTER = { lat: 39.9526, lng: -75.1652 }
const DEFAULT_RADIUS = 1600

export interface UseReportFinder {
  locations: ComputedRef<PinboardTypes.BasicLocation[]>
  searchOrUserLocation: Ref<PinboardTypes.LatLon>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>
  init: () => Promise<void>
  setFilter: (value: string) => void
  reportById: (id: string) => Report | undefined
}

export function useReportFinder(): UseReportFinder {
  const { reports, isLoading, error, load } = useNearbyReports()
  const filter = ref('all')
  const searchOrUserLocation = ref<PinboardTypes.LatLon>({
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  })

  const errorMessage = computed(() => error.value?.message ?? null)

  const locations = computed<PinboardTypes.BasicLocation[]>(() => {
    const list =
      filter.value === 'all'
        ? reports.value
        : reports.value.filter((r) => r.serviceType === filter.value)
    return list.map(reportToLocation)
  })

  function reportById(id: string): Report | undefined {
    return reports.value.find((r) => r.id === id)
  }

  async function init() {
    const pos = await getCurrentPosition()
    const center = pos ?? DEFAULT_CENTER
    searchOrUserLocation.value = { latitude: center.lat, longitude: center.lng }
    await load({ lat: center.lat, lng: center.lng, radius: DEFAULT_RADIUS })
  }

  function setFilter(value: string) {
    filter.value = value
  }

  return { locations, searchOrUserLocation, isLoading, errorMessage, filter, init, setFilter, reportById }
}
```

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/composables/useReportFinder.ts apps/philly-311/frontend/src/composables/useReportFinder.test.ts
git commit -m "feat(philly-311): useReportFinder — region seed, load-once, filter, reportById"
```

---

## Task 4: `ReportDetail.vue` — inline detail slot

**Files:**
- Create: `APP/src/components/ReportDetail.vue`
- Test: `APP/src/components/ReportDetail.test.ts`

Props `{ report: Report; onClose: () => void }`. Renders photo (or placeholder when no `mediaUrl`), status, service type, address, timestamp, description, and a `CloseButton` (`@phila/phila-ui-button`). Mirror oem's `LocationDetail.vue` structure.

- [ ] **Step 1: Write the failing test** (`ReportDetail.test.ts`)

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { CloseButton } from '@phila/phila-ui-button'
import ReportDetail from './ReportDetail.vue'
import type { Report } from '@/composables/useNearbyReports'

const report: Report = {
  id: '1', caseNumber: '1', lat: 39.95, lng: -75.16, serviceType: 'Pothole Repair',
  status: 'In Progress', address: '1234 Market St', description: 'big hole', distance: 160,
}

describe('ReportDetail', () => {
  it('renders the report fields', () => {
    const w = mount(ReportDetail, { props: { report, onClose: vi.fn() } })
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).toContain('1234 Market St')
    expect(w.text()).toContain('In Progress')
    expect(w.text()).toContain('big hole')
  })
  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    const w = mount(ReportDetail, { props: { report, onClose } })
    // CloseButton renders a native <button>; native @click fallthrough invokes onClose.
    await w.findComponent(CloseButton).trigger('click')
    expect(onClose).toHaveBeenCalled()
  })
})
```
> If `@phila/phila-ui-button`'s CSS import trips the test, the global `__test__/setup.ts` already stubs phila-ui CSS via the vitest css-stub plugin; if `CloseButton` still won't mount, fall back to `w.find('button').trigger('click')`.

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/components/ReportDetail`

- [ ] **Step 3: Implement** `ReportDetail.vue`

```vue
<!-- ABOUTME: Inline detail for a selected 311 report in Pinboard's location-detail slot:
     photo, status, service type, address, time, description. -->
<script setup lang="ts">
import { CloseButton } from '@phila/phila-ui-button'
import type { Report } from '@/composables/useNearbyReports'

defineProps<{ report: Report; onClose: () => void }>()

function formatWhen(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { timeZone: 'America/New_York' })
}
</script>

<template>
  <div class="report-detail">
    <CloseButton class="report-detail__close" @click="onClose" />
    <img v-if="report.mediaUrl" :src="report.mediaUrl" :alt="report.serviceType" class="report-detail__img" />
    <div v-else class="report-detail__img report-detail__img--placeholder" aria-hidden="true" />
    <h2 class="has-text-heading-5">{{ report.serviceType }}</h2>
    <p class="report-detail__status">{{ report.status }}</p>
    <p class="report-detail__address">{{ report.address }}</p>
    <p v-if="report.createdAt" class="report-detail__time">{{ formatWhen(report.createdAt) }}</p>
    <p v-if="report.description" class="report-detail__desc">{{ report.description }}</p>
  </div>
</template>

<style scoped>
.report-detail { position: relative; padding: var(--spacing-m, 1rem); }
.report-detail__close { position: absolute; top: 8px; right: 8px; }
.report-detail__img { width: 100%; height: 160px; object-fit: cover; border-radius: 6px; }
.report-detail__img--placeholder { background: var(--ui-color-grey-200, #e5e5e5); }
.report-detail h2 { margin: var(--spacing-s, 0.5rem) 0; }
</style>
```

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/ReportDetail.vue apps/philly-311/frontend/src/components/ReportDetail.test.ts
git commit -m "feat(philly-311): ReportDetail — inline report detail slot"
```

---

## Task 5: `LandingPage.vue` — the Pinboard finder

**Files:**
- Modify: `APP/src/pages/LandingPage.vue` (replace the placeholder)
- Test: `APP/src/pages/LandingPage.test.ts`

Read `oem-flood-finder/.../views/FinderView.vue` first and mirror its `<Pinboard>` + `#map-content` + `#location-detail`. Build `locationPanelFilter` from `common_categories`. In `#map-content`, render a `MapMarker` + `MapIconTextPin` per report (icon from `serviceTypeIconDefinition(loc.name)`, `color-theme="light-primary"`, wired to `onHover`/`onHoverEnd`/`onSelect` + hovered/selected) plus the standard controls. In `#location-detail`, look up the full report via `finder.reportById(location.id)` and render `<ReportDetail>`. **Do NOT read the slot's `map` prop** (it's `null` this slice).

- [ ] **Step 1: Write the failing component test** (`LandingPage.test.ts`)

Mock `@pinboard/ui` **locally** (don't touch global `setup.ts`).

```ts
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@pinboard/ui', () => {
  const Pinboard = defineComponent({
    name: 'Pinboard',
    props: ['locations', 'searchOrUserLocation', 'isLoading', 'errorMessage', 'locationPanelFilter'],
    emits: ['selectedLocationsFilter'],
    setup: (props, { slots }) => () =>
      h('div', { class: 'pinboard-stub' }, [
        h('div', { class: 'count' }, String(props.locations.length)),
        slots['map-content']?.({
          map: null, zoom: 12, isMobile: false, hoveredId: null, selectedId: null,
          mobileControlsTarget: null, mobileControlsTargetLeft: null,
          onHover: () => {}, onHoverEnd: () => {}, onSelect: () => {},
        }),
      ]),
  })
  const passthrough = (name: string) =>
    defineComponent({ name, setup: (_p, { slots }) => () => h('div', slots.default?.()) })
  return {
    Pinboard,
    MapMarker: passthrough('MapMarker'),
    MapIconTextPin: passthrough('MapIconTextPin'),
    MapNavigationControl: passthrough('MapNavigationControl'),
    GeolocationButton: passthrough('GeolocationButton'),
    BasemapToggle: passthrough('BasemapToggle'),
  }
})
vi.mock('@/composables/useGeolocation', () => ({ getCurrentPosition: vi.fn().mockResolvedValue(null) }))
const load = vi.fn().mockResolvedValue([])
vi.mock('@/composables/useNearbyReports', () => ({
  useNearbyReports: () => ({
    reports: { value: [
      { id: '1', caseNumber: '1', lat: 39.95, lng: -75.16, serviceType: 'Pothole Repair', status: 'Open', address: 'A', distance: 100 },
    ] },
    isLoading: { value: false }, error: { value: null }, load,
  }),
}))

import LandingPage from './LandingPage.vue'

describe('LandingPage', () => {
  it('mounts the Pinboard with mapped locations after init', async () => {
    const w = mount(LandingPage)
    await flushPromises()
    expect(w.find('.pinboard-stub').exists()).toBe(true)
    expect(w.find('.count').text()).toBe('1')
    expect(load).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/pages/LandingPage`

- [ ] **Step 3: Implement** `LandingPage.vue` (mirror `FinderView.vue`):

```vue
<!-- ABOUTME: The 311 reports finder — Pinboard map + list of nearby reports with
     service-type filter chips, geolocation-seeded load, and inline report detail. -->
<script setup lang="ts">
import { onMounted } from 'vue'
import {
  Pinboard, MapMarker, MapIconTextPin, MapNavigationControl, GeolocationButton, BasemapToggle,
  type PinboardTypes,
} from '@pinboard/ui'
import commonCategories from '@/data/common_categories.json'
import { useReportFinder } from '@/composables/useReportFinder'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import ReportDetail from '@/components/ReportDetail.vue'

const finder = useReportFinder()
onMounted(() => void finder.init())

const filterOptions: PinboardTypes.LocationFilterOption[] = [
  { value: 'all', label: 'All' },
  ...commonCategories.map((c) => ({ value: c.title, label: c.title })),
]
</script>

<template>
  <Pinboard
    :locations="finder.locations.value"
    :search-or-user-location="finder.searchOrUserLocation.value"
    :is-loading="finder.isLoading.value"
    :error-message="finder.errorMessage.value"
    :location-panel-filter="filterOptions"
    @selected-locations-filter="finder.setFilter"
  >
    <template #location-detail="{ location, onClose }">
      <ReportDetail
        v-if="finder.reportById(location.id)"
        :report="finder.reportById(location.id)!"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ zoom, isMobile, hoveredId, selectedId, mobileControlsTarget, onHover, onHoverEnd, onSelect }">
      <MapNavigationControl v-if="!isMobile" position="bottom-right" />
      <BasemapToggle position="top-right" :teleport-to="isMobile ? mobileControlsTarget : undefined" />
      <GeolocationButton
        :position="isMobile ? 'top-right' : 'bottom-right'"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <MapMarker
        v-for="loc in finder.locations.value"
        :key="loc.id"
        :lng-lat="[loc.longitude, loc.latitude]"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="serviceTypeIconDefinition(loc.name)"
          color-theme="light-primary"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
          @mouseenter="onHover(loc.id)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(loc)"
        />
      </MapMarker>
    </template>
  </Pinboard>
</template>
```
> Confirm exact `MapIconTextPin` props + valid `color-theme` values against `oem-flood-finder/FinderView.vue` and the `@pinboard/ui`/map-core types; drop any prop that doesn't exist. `GeolocationButton`'s `@located` can update the finder's center later (slice 2a.1); not required now.

- [ ] **Step 4: Run — expect PASS**, then `type-check`, `lint`, `format`.

- [ ] **Step 5: Manual smoke.** `pnpm dev:311`, open the app. Expect: map renders, nearby-report pins appear, the left panel lists report cards, filter chips filter list + pins, clicking a pin/card opens the inline detail. Stop the server. (If the live API returns no reports for the default center, note it — the loading/empty wiring is still verifiable.)

- [ ] **Step 6: Commit**

```bash
git add apps/philly-311/frontend/src/pages/LandingPage.vue apps/philly-311/frontend/src/pages/LandingPage.test.ts
git commit -m "feat(philly-311): LandingPage — Pinboard reports finder (map+list, filter, detail)"
```

---

## Task 6: Full verification + sanity-check the API

**Files:** none (verification only)

- [ ] **Step 1: Sanity-check the live serviceType format.** Confirm `serviceType` values match our data display names (the data-over-Figma assumption). Verify the API-key header name against `apps/philly-311/frontend/src/composables/api311.ts` first, then:

```bash
curl -s -H "x-api-key: $(grep VITE_API_KEY apps/philly-311/frontend/.env.test | cut -d= -f2)" \
  "https://yw32n3h725.execute-api.us-east-1.amazonaws.com/test/private/key/nearby-issues?lat=39.9526&lng=-75.1652&radius=2000&limit=5" | head -c 1500
```
Confirm `serviceType` looks like "Pothole Repair" etc. If materially different (e.g. short forms), STOP and report — filter-match + icon mapping key off the full display name.

- [ ] **Step 2: Full app gates.**

```bash
pnpm --filter @pinboard/philly-311 type-check   # PASS
pnpm --filter @pinboard/philly-311 lint          # exit 0
pnpm --filter @pinboard/philly-311 test:run      # all green (foundation + new units + components)
pnpm --filter @pinboard/philly-311 build         # PASS
```

- [ ] **Step 3: Monorepo no-regressions.**

```bash
pnpm build && pnpm type-check && pnpm exec turbo run test:run
git diff --name-only main..HEAD -- . ':(exclude)apps/philly-311/**' ':(exclude)docs/**'   # empty
```

---

## Definition of Done (matches the spec)

1. `/` renders the Pinboard finder: nearby reports as pins + panel list cards.
2. Single-select service-type filter chips filter both list and pins.
3. Region seeds from geolocation (default fallback) and loads once.
4. Marker/card click opens `ReportDetail` inline.
5. `type-check`, `lint`, `test:run`, `build` all green for `@pinboard/philly-311`.
6. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope (later slices)

Slice 2a.1 (reload-on-pan + the `@pinboard/ui` map-exposure enhancement), 2b (header CTA + trending), 2c (AIS search + Figma-faithful chips), 2d (alert sheet), full `/reports/:id`, list sort. Report wizard is Increment 3.
