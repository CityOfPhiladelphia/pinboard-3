# Philly 311 — Slice 3c: Location Step — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Location placeholder with the real step: AIS address search with a results list, "Use my current location", and a persistent map with a draggable pin, storing a complete `WizardLocation` and gating Next on an in-Philly location.

**Architecture:** Thin `LocationStep.vue` orchestrates the store and owns validity via `useWizardValidity`. Two focused children, both POC ports: `AddressSearch` (debounced AIS autocomplete → resolve on pick → `select(AisFeature)`) and `LocationMap` (`@phila/phila-ui-map-core` Map + draggable MapMarker, Philly default view when no location, `move`/`outOfBounds` events). Two-column Figma layout: form left, map right.

**Tech Stack:** Vue 3.5, Pinia (`reportSubmission`), `useAis`, `useGeolocation`, `useDebouncedSearch`, `useWizardValidity`, `useMapBounds`, `utils/bounds.isInPhilly`, `@phila/phila-ui-map-core` (Map/MapMarker), FontAwesome, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-philly-311-location-step-design.md`

**Conventions for every task:**
- Paths relative to `pinboard-3/` root. Branch `feat/philly-311-location` off `311-staging` — create it before Task 1: `git checkout 311-staging && git checkout -b feat/philly-311-location`.
- `APP` = `apps/philly-311/frontend`. Run filtered: `pnpm --filter @pinboard/philly-311 <script>` (`type-check`, `lint`, `test:run`, `format`, `build`).
- Prettier `semi: false, singleQuote: true, printWidth: 100` — run `format` before each commit.
- TDD per task: failing test → run (fails) → implement → run (passes) → `type-check` + `lint` → `format` → commit. Keep `test:run` fully green at every commit.
- **Scope:** only `APP` (src + package.json). Do NOT touch `@pinboard/ui` or other apps.
- All new code files start with `ABOUTME: ` header lines.

**Known facts (verified against the codebase):**
- `useAis` (`APP/src/composables/useAis.ts`): `autocompleteAddresses(q, signal?) → Promise<AisAutocompleteResult[]>` where `AisAutocompleteResult = {address, searchAddress}`; `searchAddress(query, signal?) → Promise<AisFeature|null>`; `reverseGeocode(lat, lng, signal?) → Promise<AisFeature|null>`; `AisFeature = {streetAddress, zipCode?, lat, lng}`. Search/reverse return `null` on non-OK responses but `fetch` itself can still reject (network) — handle both.
- `useDebouncedSearch<T>({initial, delay?=250, fetcher(q, signal), onEmpty?})` → `{query, results, loading, error}` (all Refs; `error: Ref<string|null>`). Setting `query` fires a debounced fetch; empty/whitespace query resets to `initial`. **Programmatically setting `query` re-fires the fetch** — `AddressSearch` must keep its result list closed after a pick (see Task 2).
- `getCurrentPosition(): Promise<{lat, lng}|null>` — resolves `null` on denial/error/timeout, never rejects.
- Store (`APP/src/stores/reportSubmission.ts`): `setLocation(location: WizardLocation|null)`; `WizardLocation = {address: string, zipCode?: string, lat: number, lng: number}` (`APP/src/types/wizard.ts`). The router guard may deep-link-seed `{address: '', lat, lng}`.
- `isInPhilly(lat, lng)` (`APP/src/utils/bounds.ts`): bbox lat 39.867–40.137, lng −75.281…−74.955. Wilmington DE (39.7447, −75.5484) is out; City Hall (39.9526, −75.1652) is in.
- `useMapBounds(mapRef)` (`APP/src/composables/useMapBounds.ts`): clamps a phila-ui-map-core `<Map>` to `PHILLY_MAP_BOUNDS` once loaded; accesses the instance structurally as `{map: {value}, isLoaded: {value}}`. The bounds clamp keeps the default basemap inside its cached tile region — no custom raster source needed (POC-proven).
- `useWizardValidity(validity: ComputedRef<boolean>)` + `WIZARD_CAN_ADVANCE_KEY = 'wizard:canAdvance'` (`APP/src/composables/useWizardValidity.ts`). The shell (`ReportPage.vue`) provides the ref and owns Back/Next — **the step has no Continue button** (unlike the POC).
- `APP/src/__test__/setup.ts` already mocks `@phila/phila-ui-map-core` (`Map`, `MapMarker`, `RasterLayer`) as slot-rendering div stubs — component tests mount without real maplibre.
- `@phila/phila-ui-map-core` is **NOT** in `APP/package.json` (only `packages/ui` has it, pinned exact `1.1.0-beta.12`); `maplibre-gl ^5.24.0` is already a dep. Task 1 adds map-core + its CSS.
- FontAwesome is already wired: `@fortawesome/vue-fontawesome` + `@fortawesome/pro-solid-svg-icons` (v7, has `faLocationDot`, `faMagnifyingGlass`).
- Philly default view: City Hall `[-75.163789, 39.952335]` (`[lng, lat]`), zoom 12; zoom 16 at a chosen point (POC values).
- POC sources to port: `/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src/components/wizard/AisAutocomplete.vue` (+`.test.ts`), `components/wizard/LocationMap.vue` (+`.test.ts`), `pages/report/LocationStep.vue` (+`.test.ts`).
- `pnpm install` needs the fontawesome token inline: `NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A pnpm install` (low-security token, ships in FE bundle).
- Wizard route order (`APP/src/router/index.ts`): `/report` → `/report/issue-type` → `/report/location` → `/report/details` → `/report/review`. The shell's Next routes Location → Details.

---

## Task 1: Dependency — `@phila/phila-ui-map-core`

**Files:**
- Modify: `apps/philly-311/frontend/package.json`
- Modify: `apps/philly-311/frontend/src/main.ts`
- Modify: `pnpm-lock.yaml` (generated)

- [ ] **Step 1: Add the dep.** In `APP/package.json` dependencies, alphabetically among the `@phila/*` entries, pinned exact to match the `packages/ui` pin:

```json
    "@phila/phila-ui-map-core": "1.1.0-beta.12",
```

- [ ] **Step 2: Install.**

```bash
NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A pnpm install
```
Expected: exits 0, lockfile updated.

- [ ] **Step 3: Add the CSS.** In `APP/src/main.ts`, with the other top-of-file imports (the POC does the same — maplibre's canvas/controls CSS ships in this bundle):

```ts
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
```

- [ ] **Step 4: Verify the import resolves.**

```bash
node -e "console.log(require.resolve('@phila/phila-ui-map-core', { paths: ['apps/philly-311/frontend'] }))"
```
Expected: prints a path under `node_modules/.pnpm/@phila+phila-ui-map-core@1.1.0-beta.12...`.

- [ ] **Step 5: Sanity check.** `pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 test:run` — both green (no behavior changed).

- [ ] **Step 6: Commit.**

```bash
git add apps/philly-311/frontend/package.json apps/philly-311/frontend/src/main.ts pnpm-lock.yaml
git commit -m "feat(philly-311): add phila-ui-map-core for the location step map"
```

---

## Task 2: `AddressSearch.vue` — POC `AisAutocomplete` port, Figma-styled

**Files:**
- Create: `apps/philly-311/frontend/src/components/wizard/AddressSearch.vue`
- Test: `apps/philly-311/frontend/src/components/wizard/AddressSearch.test.ts`

Behavior: typing fires debounced `autocompleteAddresses`; results render as a list (pin icon, address, "Philadelphia, PA" subtitle — the autocomplete API returns no per-candidate zip); picking a result calls `searchAddress(r.searchAddress)` and emits `select(feature)`; the input then shows the resolved address and the list closes — **and stays closed**, because echoing the address into `query` re-fires the debounced fetch (an `open` flag, set on user input only, gates the list and the loading line).

- [ ] **Step 1: Write the failing test.**

```ts
// ABOUTME: Tests for AddressSearch — debounced autocomplete, result rendering,
// ABOUTME: pick-resolution + select emission, list-stays-closed after pick, errors.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import AddressSearch from './AddressSearch.vue'

const mockAutocompleteAddresses = vi.fn()
const mockSearchAddress = vi.fn()

vi.mock('@/composables/useAis', () => ({
  autocompleteAddresses: (...args: unknown[]) => mockAutocompleteAddresses(...args),
  searchAddress: (...args: unknown[]) => mockSearchAddress(...args),
}))

const FEATURE = {
  streetAddress: '1234 MARKET ST',
  zipCode: '19107',
  lat: 39.9526,
  lng: -75.1652,
}

async function typeAndSettle(wrapper: VueWrapper, text: string) {
  await wrapper.find('input').setValue(text)
  await vi.advanceTimersByTimeAsync(260)
  await wrapper.vm.$nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
  mockAutocompleteAddresses.mockReset()
  mockSearchAddress.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AddressSearch - debounce + results', () => {
  it('calls autocompleteAddresses after the debounce and renders results with city line', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])

    const wrapper = mount(AddressSearch)
    await wrapper.find('input').setValue('1234')
    expect(mockAutocompleteAddresses).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(260)
    await wrapper.vm.$nextTick()
    expect(mockAutocompleteAddresses).toHaveBeenCalledTimes(1)
    expect(mockAutocompleteAddresses.mock.calls[0][0]).toBe('1234')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1234 MARKET ST')
    expect(wrapper.text()).toContain('Philadelphia, PA')
  })

  it('does not fetch when query is empty', async () => {
    const wrapper = mount(AddressSearch)
    await wrapper.find('input').setValue('')
    await vi.advanceTimersByTimeAsync(260)
    expect(mockAutocompleteAddresses).not.toHaveBeenCalled()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })
})

describe('AddressSearch - picking a result', () => {
  it('resolves via searchAddress, emits select, echoes the address, closes the list', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(FEATURE)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')

    await wrapper.find('[role="listbox"] button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(mockSearchAddress).toHaveBeenCalledWith('1234 MARKET ST')
    expect(wrapper.emitted('select')![0]).toEqual([FEATURE])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1234 MARKET ST')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('keeps the list closed after the pick echo re-fires the debounced fetch', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(FEATURE)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    await wrapper.find('[role="listbox"] button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)

    // The echoed query re-fires the debounced autocomplete; the list must not reopen.
    await vi.advanceTimersByTimeAsync(300)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.find('.address-search__loading').exists()).toBe(false)
  })

  it('shows an error and does not emit when searchAddress returns null', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(null)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    await wrapper.find('[role="listbox"] button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('select')).toBeFalsy()
    expect(wrapper.find('.address-search__error').text()).toContain("Couldn't resolve")
  })
})

describe('AddressSearch - error handling', () => {
  it('shows an error message when the autocomplete fetch fails', async () => {
    mockAutocompleteAddresses.mockRejectedValue(new Error('AIS autocomplete failed: 500'))

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')

    expect(wrapper.find('.address-search__error').text()).toContain('AIS autocomplete failed')
  })
})
```

- [ ] **Step 2: Run it — must fail.**

```bash
pnpm --filter @pinboard/philly-311 test:run AddressSearch
```
Expected: FAIL — cannot resolve `./AddressSearch.vue`.

- [ ] **Step 3: Implement the component.**

```vue
<!-- ABOUTME: AIS-backed address search. Typing fires /autocomplete (debounced);
     picking a result fires /search to resolve coords and emits select(feature). -->
<script setup lang="ts">
import { ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLocationDot, faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import {
  autocompleteAddresses,
  searchAddress,
  type AisAutocompleteResult,
  type AisFeature,
} from '@/composables/useAis'

const emit = defineEmits<{ select: [feature: AisFeature] }>()

const { query, results, loading, error } = useDebouncedSearch<AisAutocompleteResult[]>({
  initial: [],
  fetcher: (q, signal) => autocompleteAddresses(q, signal),
})

// Closed after a pick: echoing the resolved address into `query` re-fires the
// debounced autocomplete, and the list must not reopen until the user types.
const open = ref(false)

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
}

async function pick(r: AisAutocompleteResult) {
  open.value = false
  loading.value = true
  error.value = null
  try {
    const feature = await searchAddress(r.searchAddress)
    if (feature) {
      emit('select', feature)
      query.value = feature.streetAddress
      results.value = []
    } else {
      error.value = "Couldn't resolve that address."
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="address-search">
    <div class="address-search__box">
      <input
        id="address-search-input"
        :value="query"
        type="search"
        aria-label="Address"
        placeholder="Enter an address, intersection, or place"
        autocomplete="off"
        @input="onInput"
      />
      <FontAwesomeIcon :icon="faMagnifyingGlass" class="address-search__icon" />
    </div>
    <p v-if="open && loading" class="address-search__loading">Searching&hellip;</p>
    <p v-if="error" class="address-search__error">{{ error }}</p>
    <ul v-if="open && results.length" class="address-search__results" role="listbox">
      <li v-for="r in results" :key="r.searchAddress" role="option">
        <button type="button" @click="pick(r)">
          <FontAwesomeIcon :icon="faLocationDot" class="address-search__pin" />
          <span class="address-search__lines">
            <span class="address-search__address">{{ r.address }}</span>
            <span class="address-search__city">Philadelphia, PA</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.address-search__box {
  position: relative;
}
.address-search__box input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 40px 10px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
}
.address-search__icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ui-color-primary, #0f4d90);
}
.address-search__results {
  list-style: none;
  margin: var(--spacing-xs, 0.5rem) 0 0;
  padding: 0;
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  overflow: hidden;
}
.address-search__results li + li {
  border-top: 1px solid var(--ui-color-grey-200, #e3e3e3);
}
.address-search__results button {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}
.address-search__results button:hover {
  background: var(--ui-color-grey-100, #f5f5f5);
}
.address-search__pin {
  flex: none;
}
.address-search__lines {
  display: flex;
  flex-direction: column;
}
.address-search__address {
  font-weight: 600;
}
.address-search__city {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.address-search__loading,
.address-search__error {
  margin: var(--spacing-xs, 0.5rem) 0 0;
  font-size: 0.875rem;
}
.address-search__error {
  color: var(--ui-color-red, #c0392b);
}
</style>
```

- [ ] **Step 4: Run the test — must pass.**

```bash
pnpm --filter @pinboard/philly-311 test:run AddressSearch
```
Expected: PASS (6 tests).

- [ ] **Step 5: Quality gates + commit.**

```bash
pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/components/wizard/AddressSearch.vue apps/philly-311/frontend/src/components/wizard/AddressSearch.test.ts
git commit -m "feat(philly-311): AddressSearch — AIS autocomplete with resolve-on-pick"
```

---

## Task 3: `LocationMap.vue` — POC port with a no-location state

**Files:**
- Create: `apps/philly-311/frontend/src/components/wizard/LocationMap.vue`
- Test: `apps/philly-311/frontend/src/components/wizard/LocationMap.test.ts`

Behavior: prop is `location: {lat, lng} | null` (the POC required `lat`/`lng` and was `v-if`-mounted; this version is persistent). No location → Philly default view, no marker. Location → draggable marker, `dragend` emits `move({lat,lng})`; a watcher emits `outOfBounds` whenever the location is outside Philly. On location change the underlying maplibre instance flies to the point (the wrapper only honors `:center` at mount).

- [ ] **Step 1: Write the failing test.**

```ts
// ABOUTME: Tests for LocationMap — empty-state map without marker, marker render,
// ABOUTME: dragend move emission, and outOfBounds emission for non-Philly points.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Map as PhilaMap, MapMarker } from '@phila/phila-ui-map-core'
import LocationMap from './LocationMap.vue'

const IN_PHILLY = { lat: 39.9526, lng: -75.1652 }
const WILMINGTON = { lat: 39.7447, lng: -75.5484 }

describe('LocationMap - no location', () => {
  it('renders the map without a marker and emits nothing', () => {
    const wrapper = mount(LocationMap, { props: { location: null } })
    expect(wrapper.findComponent(PhilaMap).exists()).toBe(true)
    expect(wrapper.findComponent(MapMarker).exists()).toBe(false)
    expect(wrapper.emitted('outOfBounds')).toBeFalsy()
  })
})

describe('LocationMap - in-bounds location', () => {
  it('renders a marker and does not emit outOfBounds', () => {
    const wrapper = mount(LocationMap, { props: { location: IN_PHILLY } })
    expect(wrapper.findComponent(MapMarker).exists()).toBe(true)
    expect(wrapper.emitted('outOfBounds')).toBeFalsy()
  })

  it('emits move with {lat, lng} when the marker emits dragend', async () => {
    const wrapper = mount(LocationMap, { props: { location: IN_PHILLY } })
    await wrapper.findComponent(MapMarker).vm.$emit('dragend', { lng: -75.16, lat: 39.95 })
    expect(wrapper.emitted('move')![0]).toEqual([{ lat: 39.95, lng: -75.16 }])
  })
})

describe('LocationMap - out-of-bounds location', () => {
  it('emits outOfBounds when mounted outside Philadelphia', () => {
    const wrapper = mount(LocationMap, { props: { location: WILMINGTON } })
    expect(wrapper.emitted('outOfBounds')).toBeTruthy()
  })

  it('emits outOfBounds when the location moves outside Philadelphia', async () => {
    const wrapper = mount(LocationMap, { props: { location: IN_PHILLY } })
    expect(wrapper.emitted('outOfBounds')).toBeFalsy()
    await wrapper.setProps({ location: WILMINGTON })
    expect(wrapper.emitted('outOfBounds')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run it — must fail.**

```bash
pnpm --filter @pinboard/philly-311 test:run LocationMap
```
Expected: FAIL — cannot resolve `./LocationMap.vue`.

- [ ] **Step 3: Implement the component.**

```vue
<!-- ABOUTME: Location-step map using @phila/phila-ui-map-core (MapLibre). Shows a
     Philly default view until a location exists, then a draggable marker that
     emits move({lat,lng}) on dragend; emits outOfBounds for non-Philly points. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Map as PhilaMap, MapMarker } from '@phila/phila-ui-map-core'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { isInPhilly } from '@/utils/bounds'
import { useMapBounds } from '@/composables/useMapBounds'

const PHILLY_DEFAULT: [number, number] = [-75.163789, 39.952335] // City Hall [lng, lat]

const props = defineProps<{ location: { lat: number; lng: number } | null }>()
const emit = defineEmits<{
  move: [point: { lat: number; lng: number }]
  outOfBounds: []
}>()

interface PhilaMapInstance {
  map: { value: MapLibreMap | null }
  isLoaded: { value: boolean }
}
const philaMap = ref<PhilaMapInstance | null>(null)
useMapBounds(philaMap as never)

const center = computed<[number, number]>(() =>
  props.location ? [props.location.lng, props.location.lat] : PHILLY_DEFAULT,
)
const zoom = computed(() => (props.location ? 16 : 12))

watch(
  () => props.location,
  (loc) => {
    if (!loc) return
    if (!isInPhilly(loc.lat, loc.lng)) emit('outOfBounds')
    // The wrapper only honors :center at mount; recenter the live map ourselves.
    // Keep the user's zoom unless they're zoomed too far out to see the pin.
    const m = philaMap.value?.map?.value
    if (m) m.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(m.getZoom(), 16) })
  },
  { immediate: true },
)

function onDragEnd(p: { lng: number; lat: number }) {
  emit('move', { lat: p.lat, lng: p.lng })
}
</script>

<template>
  <div class="location-map">
    <PhilaMap ref="philaMap" :center="center" :zoom="zoom">
      <MapMarker
        v-if="location"
        :lngLat="[location.lng, location.lat]"
        draggable
        ariaLabel="Drag to refine the location"
        @dragend="onDragEnd"
      />
    </PhilaMap>
  </div>
</template>

<style scoped>
.location-map {
  width: 100%;
  height: 420px;
  position: relative;
}
.location-map :deep(.map-wrapper),
.location-map :deep(.maplibregl-map) {
  width: 100%;
  height: 100%;
}
</style>
```

- [ ] **Step 4: Run the test — must pass.**

```bash
pnpm --filter @pinboard/philly-311 test:run LocationMap
```
Expected: PASS (5 tests). (The setup-mocked `Map` stub has no `map`/`isLoaded`, so the flyTo branch and `useMapBounds` are inert in tests — both are exercised by the live smoke.)

- [ ] **Step 5: Quality gates + commit.**

```bash
pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/components/wizard/LocationMap.vue apps/philly-311/frontend/src/components/wizard/LocationMap.test.ts
git commit -m "feat(philly-311): LocationMap — draggable pin with Philly default view"
```

---

## Task 4: `LocationStep.vue` — orchestrator

**Files:**
- Modify: `apps/philly-311/frontend/src/pages/report/LocationStep.vue` (replace the placeholder entirely)
- Test: `apps/philly-311/frontend/src/pages/report/LocationStep.test.ts`

Behavior per spec: two-column layout (form left, map right; stacks ≤768px). `select` → `setLocation` + clear error; "Use my current location" → geolocate → reverse-geocode (with "Locating…" disabled state); pin `move` → reverse-geocode, falling back to coords-only `setLocation` keeping the address; `outOfBounds` → Philly-only error; any new in-bounds location clears the error. Validity = location set AND in Philly. No Continue button — the shell owns Next.

- [ ] **Step 1: Write the failing test.**

```ts
// ABOUTME: Tests for LocationStep — AIS select, geolocation paths, map move +
// ABOUTME: coords-only fallback, out-of-bounds error/clearing, canAdvance gating.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LocationStep from './LocationStep.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const mockReverseGeocode = vi.fn()
vi.mock('@/composables/useAis', () => ({
  // AddressSearch (which uses autocompleteAddresses/searchAddress) is stubbed
  // below, so only reverseGeocode needs to be functional here.
  reverseGeocode: (...args: unknown[]) => mockReverseGeocode(...args),
}))

const mockGetCurrentPosition = vi.fn()
vi.mock('@/composables/useGeolocation', () => ({
  getCurrentPosition: () => mockGetCurrentPosition(),
}))

vi.mock('@/components/wizard/AddressSearch.vue', () => ({
  default: {
    name: 'AddressSearch',
    emits: ['select'],
    template: '<div data-testid="address-search" />',
  },
}))

vi.mock('@/components/wizard/LocationMap.vue', () => ({
  default: {
    name: 'LocationMap',
    props: ['location'],
    emits: ['outOfBounds', 'move'],
    template: '<div data-testid="location-map" />',
  },
}))

const IN_PHILLY_FEATURE = {
  streetAddress: '1234 MARKET ST',
  zipCode: '19107',
  lat: 39.9526,
  lng: -75.1652,
}

const OUT_OF_PHILLY_FEATURE = {
  streetAddress: '100 N MARKET ST',
  zipCode: '19801',
  lat: 39.7447,
  lng: -75.5484,
}

function mountStep(canAdvance = ref(false)) {
  return {
    canAdvance,
    w: mount(LocationStep, {
      global: { provide: { 'wizard:canAdvance': canAdvance } },
    }),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockReverseGeocode.mockReset()
  mockGetCurrentPosition.mockReset()
})

describe('LocationStep - AIS select', () => {
  it('stores a full WizardLocation and enables canAdvance', async () => {
    const { w, canAdvance } = mountStep()
    expect(canAdvance.value).toBe(false)

    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', IN_PHILLY_FEATURE)
    await flushPromises()

    const store = useReportSubmissionStore()
    expect(store.location).toEqual({
      address: '1234 MARKET ST',
      zipCode: '19107',
      lat: 39.9526,
      lng: -75.1652,
    })
    expect(canAdvance.value).toBe(true)
  })

  it('keeps canAdvance false for an out-of-Philly selection', async () => {
    const { w, canAdvance } = mountStep()
    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', OUT_OF_PHILLY_FEATURE)
    await flushPromises()
    expect(canAdvance.value).toBe(false)
  })
})

describe('LocationStep - Use my current location', () => {
  it('stores the reverse-geocoded location and enables canAdvance', async () => {
    mockGetCurrentPosition.mockResolvedValue({ lat: 39.9526, lng: -75.1652 })
    mockReverseGeocode.mockResolvedValue(IN_PHILLY_FEATURE)

    const { w, canAdvance } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    await flushPromises()

    const store = useReportSubmissionStore()
    expect(store.location?.address).toBe('1234 MARKET ST')
    expect(canAdvance.value).toBe(true)
  })

  it('shows an error and leaves the store empty when geolocation is denied', async () => {
    mockGetCurrentPosition.mockResolvedValue(null)

    const { w } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    await flushPromises()

    expect(useReportSubmissionStore().location).toBeNull()
    expect(w.find('[role="alert"]').text()).toContain("couldn't access your location")
  })

  it('shows an error when reverseGeocode returns null', async () => {
    mockGetCurrentPosition.mockResolvedValue({ lat: 39.9526, lng: -75.1652 })
    mockReverseGeocode.mockResolvedValue(null)

    const { w } = mountStep()
    await w.find('[data-test="use-my-location"]').trigger('click')
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toContain("couldn't resolve your location")
  })
})

describe('LocationStep - out-of-bounds error', () => {
  it('shows the Philly-only error when LocationMap emits outOfBounds', async () => {
    const { w, canAdvance } = mountStep()
    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', OUT_OF_PHILLY_FEATURE)
    await w.findComponent({ name: 'LocationMap' }).vm.$emit('outOfBounds')
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toContain('311 only handles requests in Philadelphia')
    expect(canAdvance.value).toBe(false)
  })

  it('clears the error when a new in-bounds location is selected', async () => {
    const { w, canAdvance } = mountStep()
    await w.findComponent({ name: 'LocationMap' }).vm.$emit('outOfBounds')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)

    await w.findComponent({ name: 'AddressSearch' }).vm.$emit('select', IN_PHILLY_FEATURE)
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(canAdvance.value).toBe(true)
  })
})

describe('LocationStep - map move', () => {
  it('reverse-geocodes the new point and stores the feature', async () => {
    mockReverseGeocode.mockResolvedValue(IN_PHILLY_FEATURE)

    const { w } = mountStep()
    const store = useReportSubmissionStore()
    store.setLocation({ address: 'OLD ADDRESS', lat: 39.95, lng: -75.17 })

    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.9526, lng: -75.1652 })
    await flushPromises()

    expect(mockReverseGeocode).toHaveBeenCalledWith(39.9526, -75.1652)
    expect(store.location?.address).toBe('1234 MARKET ST')
  })

  it('keeps the address and updates coords when reverseGeocode returns null', async () => {
    mockReverseGeocode.mockResolvedValue(null)

    const { w } = mountStep()
    const store = useReportSubmissionStore()
    store.setLocation({ address: 'Original Address', lat: 39.9526, lng: -75.1652 })

    await w.findComponent({ name: 'LocationMap' }).vm.$emit('move', { lat: 39.94, lng: -75.15 })
    await flushPromises()

    expect(store.location).toEqual({ address: 'Original Address', lat: 39.94, lng: -75.15 })
  })
})

describe('LocationStep - chosen-address line', () => {
  it('shows the address when set, and falls back to coords for a deep-link seed', async () => {
    const { w } = mountStep()
    const store = useReportSubmissionStore()

    store.setLocation({ address: '1234 MARKET ST', zipCode: '19107', lat: 39.9526, lng: -75.1652 })
    await flushPromises()
    expect(w.find('[data-test="chosen-address"]').text()).toContain('1234 MARKET ST')

    store.setLocation({ address: '', lat: 39.9526, lng: -75.1652 })
    await flushPromises()
    expect(w.find('[data-test="chosen-address"]').text()).toContain('39.9526, -75.1652')
  })
})
```

- [ ] **Step 2: Run it — must fail.**

```bash
pnpm --filter @pinboard/philly-311 test:run LocationStep
```
Expected: FAIL — the placeholder has no `data-test="use-my-location"`, no store writes, and forces `canAdvance` true on mount (assertions like `expect(canAdvance.value).toBe(false)` fail).

- [ ] **Step 3: Implement the step.** Replace the placeholder file entirely:

```vue
<!-- ABOUTME: Wizard step 3 — location. AIS address search is primary; a persistent
     map shows the chosen point with a draggable pin; "Use my current location" uses
     browser geolocation. Stores a complete WizardLocation; Next gated on in-Philly. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { reverseGeocode, type AisFeature } from '@/composables/useAis'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { useWizardValidity } from '@/composables/useWizardValidity'
import { isInPhilly } from '@/utils/bounds'
import AddressSearch from '@/components/wizard/AddressSearch.vue'
import LocationMap from '@/components/wizard/LocationMap.vue'

const store = useReportSubmissionStore()
const error = ref<string | null>(null)
const lookingUp = ref(false)

useWizardValidity(
  computed(() => !!store.location && isInPhilly(store.location.lat, store.location.lng)),
)

const mapLocation = computed(() =>
  store.location ? { lat: store.location.lat, lng: store.location.lng } : null,
)

function onSelect(f: AisFeature) {
  store.setLocation({ address: f.streetAddress, zipCode: f.zipCode, lat: f.lat, lng: f.lng })
  if (isInPhilly(f.lat, f.lng)) error.value = null
}

function onOutOfBounds() {
  error.value = '311 only handles requests in Philadelphia.'
}

async function onMove({ lat, lng }: { lat: number; lng: number }) {
  try {
    const feature = await reverseGeocode(lat, lng)
    if (feature) {
      onSelect(feature)
      return
    }
  } catch {
    /* fall through to the coords-only update */
  }
  if (store.location) {
    store.setLocation({ ...store.location, lat, lng })
    if (isInPhilly(lat, lng)) error.value = null
  }
}

async function useMyLocation() {
  lookingUp.value = true
  error.value = null
  const pos = await getCurrentPosition()
  if (!pos) {
    error.value = "We couldn't access your location. Type an address instead."
    lookingUp.value = false
    return
  }
  try {
    const feature = await reverseGeocode(pos.lat, pos.lng)
    if (feature) onSelect(feature)
    else error.value = "We couldn't resolve your location to an address."
  } catch {
    error.value = "We couldn't resolve your location to an address."
  } finally {
    lookingUp.value = false
  }
}
</script>

<template>
  <div class="location-step">
    <h1 class="location-step__title">
      Location <span class="location-step__required">* (required)</span>
    </h1>

    <div class="location-step__columns">
      <div class="location-step__form">
        <AddressSearch @select="onSelect" />
        <button
          type="button"
          data-test="use-my-location"
          class="location-step__geolocate"
          :disabled="lookingUp"
          @click="useMyLocation"
        >
          {{ lookingUp ? 'Locating…' : 'Use my current location' }}
        </button>
        <p v-if="store.location" class="location-step__chosen" data-test="chosen-address">
          <strong>{{
            store.location.address || `${store.location.lat}, ${store.location.lng}`
          }}</strong>
        </p>
        <p v-if="error" class="location-step__error" role="alert">{{ error }}</p>
      </div>

      <LocationMap :location="mapLocation" @move="onMove" @out-of-bounds="onOutOfBounds" />
    </div>
  </div>
</template>

<style scoped>
.location-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.location-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 1rem;
}
.location-step__columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: var(--spacing-m, 1rem);
  align-items: start;
}
.location-step__geolocate {
  margin-top: var(--spacing-s, 0.75rem);
  background: none;
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 9999px;
  color: var(--ui-color-primary, #0f4d90);
  font-weight: 600;
  padding: 6px 16px;
  cursor: pointer;
}
.location-step__geolocate:disabled {
  opacity: 0.6;
  cursor: default;
}
.location-step__chosen {
  margin: var(--spacing-s, 0.75rem) 0 0;
}
.location-step__error {
  margin: var(--spacing-s, 0.75rem) 0 0;
  color: var(--ui-color-red, #c0392b);
}
@media (max-width: 768px) {
  .location-step__columns {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 4: Run the test — must pass.**

```bash
pnpm --filter @pinboard/philly-311 test:run LocationStep
```
Expected: PASS (10 tests).

- [ ] **Step 5: Full suite + quality gates + commit.**

```bash
pnpm --filter @pinboard/philly-311 test:run && pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/pages/report/LocationStep.vue apps/philly-311/frontend/src/pages/report/LocationStep.test.ts
git commit -m "feat(philly-311): Location step — search, geolocate, draggable pin, bounds gating"
```

---

## Task 5: Full verification + live smoke

**Files:** none (verification only).

- [ ] **Step 1: App-filtered gates.**

```bash
pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 test:run && pnpm --filter @pinboard/philly-311 build
```
Expected: all green.

- [ ] **Step 2: Monorepo gates.**

```bash
pnpm turbo run build type-check test
```
Expected: all packages green; `@pinboard/ui` untouched (`git status` shows changes only under `apps/philly-311` + lockfile + docs).

- [ ] **Step 3: Live Playwright smoke.** Start the dev server (`pnpm --filter @pinboard/philly-311 dev`) and drive a real browser (Playwright MCP):
  1. Navigate to `/report` → **Skip** the Image step.
  2. On Issue type: search the directory (e.g. "pothole"), select a type, answer any required questions → **Next**.
  3. On Location: Next is **disabled**; the map renders the Philly default view with no pin.
  4. Type "1234 Market" in the address search → results list appears with "Philadelphia, PA" subtitles → pick a result.
  5. The chosen-address line shows the resolved address, the pin appears on the map, the list stays closed, and **Next enables**.
  6. Best-effort: drag the pin a block and confirm the chosen-address line updates after the reverse-geocode. (If dragging proves flaky under automation, verify the `move` path manually and note it.)
  7. Click **Next** → lands on `/report/details` placeholder.
  - Known/not-ours: a benign dev-only console error `Unexpected token '<'` from `@phila/phila-ui-map-core` (Pictometry). Any OTHER console error fails the smoke.

- [ ] **Step 4: Mark the plan checkboxes done and hand off** to the finishing-a-development-branch flow (Option 1 = `--no-ff` merge to `311-staging`, nothing pushed).

---

## Definition of Done (matches the spec)

1. `/report/location` renders the two-column step per the Figma structure: search with results list, "Use my current location", persistent map with draggable pin.
2. Selecting an address (search, geolocate, or pin drag) writes a complete `WizardLocation`; Philly-bounds validation gates Next via `useWizardValidity`.
3. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`; turbo build/type-check/test green monorepo-wide; `@pinboard/ui` unchanged.
4. Playwright smoke passes on the live dev server.

## Out of scope (later slices)

3d Details, 3e Review + submit + `/report/confirmation` (includes the `store.submit()` setup-scope `useApi` fix); photo-EXIF location suggestion; structured address form; fidelity slice; Increment 4 (CDK/deploy).
