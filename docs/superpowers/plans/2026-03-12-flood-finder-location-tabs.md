# Flood Finder Location Tabs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tab-based filtering to oem-flood-finder so users switch between gauges and cameras, controlling both the location list and map pins.

**Architecture:** Module-level `locationMode` ref in `useLocations.ts` filters data reactively. A new `#locations-header` slot in Pinboard.vue allows the app to render tabs. Pinboard watches for stale selections when filtered data changes.

**Tech Stack:** Vue 3, TypeScript, @pinboard/ui, @phila/phila-ui-map-core, @fortawesome/free-solid-svg-icons

**Spec:** `docs/superpowers/specs/2026-03-12-flood-finder-location-tabs-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/ui/src/components/Pinboard.vue` | Add `#locations-header` slot + stale selection watcher |
| Modify | `apps/oem-flood-finder/frontend/src/composables/useLocations.ts` | Add `locationMode` ref, filter returned State |
| Modify | `apps/oem-flood-finder/frontend/src/App.vue` | Render tabs + conditional pin styles |
| Create | `apps/oem-flood-finder/frontend/src/components/GaugeReadings.vue` | Child component that calls useLocationDetail for gauge readings |
| Modify | `apps/oem-flood-finder/frontend/src/components/LocationDetail.vue` | Use GaugeReadings for gauges, show camera info for cameras |

---

## Task 1: Add `#locations-header` slot to Pinboard.vue

**Files:**
- Modify: `packages/ui/src/components/Pinboard.vue:12-26` (defineSlots)
- Modify: `packages/ui/src/components/Pinboard.vue:99` (template)

- [ ] **Step 1: Add slot type to defineSlots**

In `packages/ui/src/components/Pinboard.vue`, add the new slot to the `defineSlots` generic (line 12-26):

```typescript
defineSlots<{
  home?(props: { activateFinder: () => void }): unknown
  'locations-header'?(props: {}): unknown                    // NEW
  'location-card'?(props: { location: Location }): unknown
  'location-detail'?(props: { location: Location; onClose: (e: MouseEvent) => void }): unknown
  'map-content'?(props: {
    locations: unknown
    geojson: unknown
    map: unknown
    hoveredId: string | null
    selectedId: string | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: unknown) => void
  }): unknown
}>()
```

- [ ] **Step 2: Add slot to template**

In the template, inside the `<template v-if="finderActive">` block (line 99), add the slot BEFORE `SearchFilterPanel`:

```html
<template v-if="finderActive">
  <slot name="locations-header" />
  <SearchFilterPanel v-if="loadedData" :locations="loadedData" />
  <!-- rest unchanged -->
```

- [ ] **Step 3: Add stale selection watcher**

Two edits in the `<script setup>` section:

**Edit A:** Add `watch` to the vue import (line 6):

```typescript
import { h, ref, computed, watch, nextTick, useSlots, inject, type FunctionalComponent, type Ref } from 'vue'
```

**Edit B:** After the `selectedId` computed (line 39), add the watcher:

```typescript
watch(loadedData, (data) => {
  if (selectedLocation.value && data && !data.some(loc => loc.id === selectedLocation.value!.id)) {
    selectedLocation.value = null
  }
})
```

- [ ] **Step 4: Build packages/ui**

Run from repo root:
```bash
cd packages/ui && pnpm build
```

Expected: Build succeeds. The oem-flood-finder app (linked via workspace) picks up the new slot.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Pinboard.vue
git commit -m "feat(Pinboard): add locations-header slot and stale selection watcher"
```

---

## Task 2: Add locationMode filtering to useLocations.ts

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/composables/useLocations.ts`

- [ ] **Step 1: Add locationMode ref and filterByMode function**

At the top of the file, after the existing imports, add a `computed` import and the module-level `locationMode` ref:

```typescript
import { ref, computed, onMounted, type Ref } from 'vue'
```

After the imports, before `transformLocationDTO`:

```typescript
export const locationMode = ref<'gauges' | 'cameras'>('gauges')
```

After `transformLocationDTO`, add the filter function:

```typescript
function filterByMode(locations: Location[], mode: 'gauges' | 'cameras'): Location[] {
  if (mode === 'gauges') {
    return locations.filter(loc => loc.other.kind === 'AwareGauge' || loc.other.kind === 'UsgsGauge')
  }
  return locations.filter(loc => loc.other.kind === 'Camera')
}
```

- [ ] **Step 2: Replace state ref with computed, store all locations internally**

Inside `useLocations()`, replace the current `state` ref and `fetchLocations` with:

```typescript
export function useLocations(): Ref<State> {
  const allLocations = ref<Location[]>([])
  const fetchState = ref<'loading' | 'loaded' | 'error'>('loading')
  const errorMessage = ref('')

  const state = computed<State>(() => {
    if (fetchState.value === 'loading') return { kind: 'Loading' }
    if (fetchState.value === 'error') return { kind: 'Error', message: errorMessage.value }
    return { kind: 'Loaded', data: filterByMode(allLocations.value, locationMode.value) }
  })

  async function fetchLocations() {
    const myHeaders = new Headers()
    myHeaders.append('x-api-key', import.meta.env.VITE_FLOOD_API_KEY || '')

    const response = await fetch(`${import.meta.env.VITE_FLOOD_API_BASE_URL}/location/all`, {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      fetchState.value = 'error'
      errorMessage.value = 'Error retrieving gauges'
      return
    }

    const data: LocationDTO = await response.json()
    allLocations.value = transformLocationDTO(data)
    fetchState.value = 'loaded'
  }

  onMounted(fetchLocations)
  return state
}
```

Key changes from current code:
- `locationMode` is a **module-level export** (not inside the composable)
- All locations stored in `allLocations` ref internally
- `state` is now a `computed` that filters based on `locationMode`
- `transformLocationDTO` is unchanged

- [ ] **Step 3: Commit**

```bash
git add apps/oem-flood-finder/frontend/src/composables/useLocations.ts
git commit -m "feat(flood-finder): add locationMode ref with reactive filtering in useLocations"
```

---

## Task 3: Add tabs and conditional pin rendering to App.vue

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/App.vue`

- [ ] **Step 1: Update script imports**

Add `faCamera` import and `locationMode` import:

```typescript
<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { locationMode } from './composables/useLocations'
import LocationDetail from './components/LocationDetail.vue'
</script>
```

- [ ] **Step 2: Add tabs in locations-header slot**

After the `#home` slot template, add the `#locations-header` slot:

```html
<template #locations-header>
  <div class="location-tabs" role="tablist">
    <button
      role="tab"
      :aria-selected="locationMode === 'gauges'"
      :class="{ active: locationMode === 'gauges' }"
      @click="locationMode = 'gauges'"
    >
      Gauges
    </button>
    <button
      role="tab"
      :aria-selected="locationMode === 'cameras'"
      :class="{ active: locationMode === 'cameras' }"
      @click="locationMode = 'cameras'"
    >
      Cameras
    </button>
  </div>
</template>
```

- [ ] **Step 3: Update map-content slot for conditional pin rendering**

Replace the existing `#map-content` slot with mode-aware rendering:

```html
<template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
  <MapMarker
    v-for="loc in locations"
    :key="loc.id"
    :lng-lat="[loc.longitude, loc.latitude]"
    :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
  >
    <MapIconTextPin
      v-if="locationMode === 'gauges'"
      :icon="faGauge"
      :text="loc.id.slice(0, 8)"
      color-theme="dark-primary"
      :hovered="hoveredId === loc.id"
      :selected="selectedId === loc.id"
      @mouseenter="onHover(loc.id)"
      @mouseleave="onHoverEnd()"
      @click="onSelect(loc)"
    />
    <MapIconTextPin
      v-else
      :icon="faCamera"
      color-theme="dark-error"
      :hovered="hoveredId === loc.id"
      :selected="selectedId === loc.id"
      @mouseenter="onHover(loc.id)"
      @mouseleave="onHoverEnd()"
      @click="onSelect(loc)"
    />
  </MapMarker>
</template>
```

Note: Camera pins omit the `:text` prop, rendering icon-only. `color-theme="dark-error"` makes them red.

- [ ] **Step 4: Add tab styles**

Add scoped styles for the tabs:

```css
<style scoped>
.location-tabs {
  display: flex;
  border-bottom: 1px solid #ccc;
  flex-shrink: 0;
}

.location-tabs button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: normal;
}

.location-tabs button.active {
  font-weight: bold;
  border-bottom-color: var(--Schemes-Primary, #2176d2);
}
</style>
```

- [ ] **Step 5: Commit**

```bash
git add apps/oem-flood-finder/frontend/src/App.vue
git commit -m "feat(flood-finder): add gauge/camera tabs with conditional map pin rendering"
```

---

## Task 4: Split LocationDetail for gauge vs camera locations

**Files:**
- Modify: `apps/oem-flood-finder/frontend/src/components/LocationDetail.vue`

The current LocationDetail unconditionally calls `useLocationDetail` (which fetches gauge readings via `/aware/reading/{gaugeId}`). This fires a wasteful failing API call for camera IDs. Since `useLocationDetail` uses `watchEffect` internally, it must be called at setup time — we can't conditionally skip it within the same component.

**Solution:** Use `v-if`/`v-else` in the template to render two inline sections. The gauge section is a child component (`GaugeReadings`) that calls `useLocationDetail` in its own setup. The camera section renders directly. This way the composable only runs when a gauge is selected.

- [ ] **Step 1: Create GaugeReadings child component**

Create `apps/oem-flood-finder/frontend/src/components/GaugeReadings.vue`:

```vue
<script setup lang="ts">
import { useLocationDetail } from '../composables/useLocationDetail'

const props = defineProps<{ gaugeId: string }>()

const readingState = useLocationDetail(() => props.gaugeId, 5)
</script>

<template>
  <progress v-if="readingState.kind === 'Loading'" />

  <table v-else-if="readingState.kind === 'Loaded'">
    <tr><th>Created On</th><th>Height</th></tr>
    <tr v-for="reading in readingState.data" :key="reading.readingId">
      <td>{{ reading.createdOn }}</td>
      <td>{{ reading.gaugeHeight }}</td>
    </tr>
  </table>

  <p v-else-if="readingState.kind === 'Error'">
    {{ readingState.message }}
  </p>
</template>
```

- [ ] **Step 2: Update LocationDetail to use GaugeReadings and show camera info**

Replace the full content of `LocationDetail.vue`:

```vue
<script setup lang="ts">
import type { Location } from '../types'
import { ref } from 'vue'
import GaugeReadings from './GaugeReadings.vue'

const props = defineProps<{
  location: Location,
  onClose: (event: MouseEvent) => void
}>()

const closeBtn = ref<HTMLButtonElement>()

defineExpose({ focus: () => closeBtn.value?.focus() })
</script>

<template>
  <div class="location-detail content">

    <div class="location-detail__header">
      <button ref="closeBtn" class="close-btn" aria-label="Close panel" @click="onClose">&#x2715;</button>
    </div>

    <div class="location-detail__body">
      <h2>{{ location.name }}</h2>

      <!-- Gauge detail -->
      <GaugeReadings
        v-if="location.other.kind === 'AwareGauge' || location.other.kind === 'UsgsGauge'"
        :gauge-id="location.id"
      />

      <!-- Camera detail -->
      <template v-else-if="location.other.kind === 'Camera'">
        <p v-if="location.other.data.locationDescription">
          {{ location.other.data.locationDescription }}
        </p>
        <a :href="location.other.data.pageUrl" target="_blank" rel="noopener noreferrer">
          View camera feed
        </a>
      </template>
    </div>

  </div>
</template>
```

Keep the existing `<style scoped>` block unchanged.

- [ ] **Step 3: Commit**

```bash
git add apps/oem-flood-finder/frontend/src/components/GaugeReadings.vue apps/oem-flood-finder/frontend/src/components/LocationDetail.vue
git commit -m "feat(flood-finder): split detail into gauge readings + camera info, avoid wasteful API calls"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Build packages/ui**

```bash
cd packages/ui && pnpm build
```

- [ ] **Step 2: Run oem-flood-finder dev server**

(Andy runs this himself — do not start it.)

- [ ] **Step 3: Verify the following**

Checklist:
- Default tab on load is "Gauges"
- Gauges tab: list shows only gauge locations, map shows `faGauge` pins with text labels
- Cameras tab: list shows only camera locations, map shows red `faCamera` icon-only pins
- Click a gauge card: detail panel shows readings table
- Click a camera card: detail panel shows camera name and "View camera feed" link
- Switch tabs while detail is open: detail panel closes (stale selection cleared)
- Tab active state styling: bold text + blue bottom border on active tab
