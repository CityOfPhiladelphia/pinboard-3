# Pinboard Framework: Routing & Slot-Based Architecture

## Problem

The pinboard-3 monorepo has a shared UI framework (`packages/ui`) and apps (`apps/`). Currently, routing, views, and layout logic live in the app (oem-flood-finder) rather than the framework. This forces each app to duplicate the same routing setup, view structure, and layout patterns. The map component (`MapPanel`) is also not configurable from the app.

## Solution

Move routing, views, and layout into the framework. Apps become configuration + slot content.

## Architecture

### Plugin: `createPinboard()`

Exported from `@pinboard/ui`. Apps call it in `main.ts`:

```ts
import { createPinboard } from '@pinboard/ui'

const app = createApp(App)
app.use(createPinboard({
  title: 'OEM Flood Finder',
  useLocations: () => useLocations(),
  map: {
    center: [-75.16, 39.95],
    zoom: 11,
    basemapChangeControls: { toggle: true },
  }
}))
app.mount('#app')
```

The plugin:
- Creates and installs a vue-router with standard routes (`/` -> HomeView, `/finder` -> FinderView)
- Provides all config via Vue's provide/inject so framework components can access it

### Config Interface

```ts
interface PinboardConfig {
  title: string
  useLocations: () => Ref<State>
  map?: {
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
}

type State =
  | { kind: 'Loading' }
  | { kind: 'Loaded'; data: unknown }
  | { kind: 'Error'; message: string }
```

The `useLocations` return type uses `unknown` for data — each app defines its own data shape. The framework handles Loading/Error states generically; the Loaded data is passed through to app slots.

### Pinboard.vue Changes

- **Title**: injected from config (no longer a prop)
- **RouterView**: rendered internally (no `default` slot for routing)
- **Mobile nav**: rendered automatically with Home/Finder links
- **Slot render functions**: receives app slots (`#home`, `#location-list`, `#location-detail`, `#map-content`) and provides them via Vue's provide() so views can inject and render them

### Slot API

Apps pass content to the framework via named slots on `<Pinboard>`:

```vue
<Pinboard>
  <template #home>
    <p>Landing page content here.</p>
  </template>

  <template #location-list="{ locations, onSelect }">
    <LocationList :locations="locations" @card-click="onSelect" />
  </template>

  <template #location-detail="{ location, onClose }">
    <LocationDetail :location="location" :on-close="onClose" />
  </template>

  <template #map-content="{ locations, map }">
    <CircleLayer :data="locations" ... />
  </template>
</Pinboard>
```

### Slot Plumbing (Provide/Inject Through Router)

Slots can't pass through `<RouterView>` directly. Pinboard.vue captures its slots as render functions and provides them via inject. Views inject and call them with scope props.

```ts
// packages/ui/src/types.ts
import type { InjectionKey, Slots } from 'vue'

export const PINBOARD_CONFIG_KEY: InjectionKey<PinboardConfig> = Symbol('pinboard-config')
export const PINBOARD_SLOTS_KEY: InjectionKey<Slots> = Symbol('pinboard-slots')
```

```vue
<!-- Pinboard.vue (simplified) -->
<script setup>
import { provide, useSlots } from 'vue'

const slots = useSlots()
const config = inject(PINBOARD_CONFIG_KEY)

provide(PINBOARD_SLOTS_KEY, slots)
</script>
```

```vue
<!-- FinderView.vue (simplified) -->
<script setup>
import { inject } from 'vue'

const config = inject(PINBOARD_CONFIG_KEY)
const slots = inject(PINBOARD_SLOTS_KEY)

const state = config.useLocations()

const selectedLocation = ref(null)
const detailOpen = ref(false)

function onSelect(location) {
  selectedLocation.value = location
  detailOpen.value = true
}

function onClose() {
  detailOpen.value = false
  selectedLocation.value = null
}
</script>

<template>
  <!-- In the left panel, when state is Loaded: -->
  <component :is="() => slots['location-list']({ locations: state.data, onSelect })" />

  <!-- In the detail overlay, when selectedLocation is set: -->
  <component :is="() => slots['location-detail']({ location: selectedLocation, onClose })" />

  <!-- MapPanel receives the map-content slot to render inside PhilaMap: -->
  <MapPanel :config="config.map" :locations="state.data" :map-content-slot="slots['map-content']" />
</template>
```

### State Ownership

The framework (FinderView) owns:
- **`selectedLocation`** (`ref<unknown | null>`) — set by `onSelect`, cleared by `onClose`
- **CollapsePanel open/close state** — managed via `detailOpen` ref, wired to CollapsePanel
- **Loading/Loaded/Error display** — hardcoded in the framework ("Loading..." text, error message). Apps cannot customize these.

The app owns:
- **What `onSelect` receives** — the app's LocationList emits a location object, which the framework stores
- **What `onClose` triggers** — the app's LocationDetail calls the provided `onClose` callback

### Layout

Panel widths are hardcoded in the framework:
- Left panel: 25%
- Right panel (map): 75%
- Detail overlay: 33% width, positioned over the left side

### Known Constraints

- Routes are hardcoded (`/` and `/finder`). Additional routes would require extending the plugin config.
- The `position` fields in map config accept PhilaMap's `MapControlPosition` type (`"top-left" | "top-right" | "bottom-left" | "bottom-right"`), not arbitrary strings.
- PhilaMap supports additional props not exposed through the config (e.g., `basemapUrl`, `labelsUrl`, `enableCyclomedia`, `enablePictometry`). These can be added to the config interface when needed.
- The `useLocations` composable is called during FinderView's setup, so its `onMounted` hooks bind to FinderView's lifecycle. It must not be called outside a component setup context.

### File Structure

```
packages/ui/src/
  index.ts              — exports createPinboard, Pinboard
  plugin.ts             — createPinboard() implementation
  types.ts              — PinboardConfig, injection keys
  components/
    Pinboard.vue        — shell (header, footer, RouterView, mobile nav)
    MapPanel.vue        — PhilaMap wrapper, receives config + locations, renders #map-content
    SearchFilterPanel.vue — stub (unchanged)
    MobileNavPanel.vue  — unchanged
  views/
    HomeView.vue        — generic: renders title + injected #home slot
    FinderView.vue      — layout: left panel + map + detail overlay, manages Loading/Loaded/Error
```

### Data Flow

```
App main.ts
  app.use(createPinboard({ title, useLocations, map }))
    -> installs router
    -> provides config

App App.vue
  <Pinboard>
    #home, #location-list, #location-detail, #map-content
  </Pinboard>
    -> Pinboard provides slot render functions via inject

Framework Pinboard.vue
  -> injects config for title
  -> renders AppHeader, AppFooter, RouterView
  -> renders mobile nav with RouterLinks
  -> provides slot render functions for views

Framework HomeView.vue (route: /)
  -> injects title, renders as heading
  -> injects #home slot render function, renders it

Framework FinderView.vue (route: /finder)
  -> injects useLocations from config, calls it
  -> manages Loading/Loaded/Error states
  -> left panel (25%): SearchFilterPanel + #location-list slot (receives { locations, onSelect })
  -> right panel (75%): MapPanel (receives map config + locations)
  -> detail overlay (33%): CollapsePanel + #location-detail slot (receives { location, onClose })

Framework MapPanel.vue
  -> receives map config as props
  -> passes config to <PhilaMap v-bind="mapConfig">
  -> renders #map-content slot inside PhilaMap's default slot
```

### What Stays in Apps

Each app provides:
- `main.ts` — plugin setup with app-specific config
- `App.vue` — `<Pinboard>` with slot content
- `components/` — app-specific components (LocationList, LocationDetail, etc.)
- `composables/` — app-specific data fetching (useLocations, useLocationDetail, etc.)
- `types.ts` — app-specific data types

### What Moves to packages/ui

- `views/HomeView.vue` — becomes generic, slot-based
- `views/FinderView.vue` — becomes generic layout with slots, manages state
- Router creation — inside createPinboard() plugin
- Mobile nav links — inside Pinboard.vue

### PhilaMap Integration

`MapPanel.vue` wraps `PhilaMap` from `@phila/phila-ui-map-core`. The map config from the plugin is passed through as props. PhilaMap already supports:
- View: center, zoom, pitch, bearing, minZoom, maxZoom
- Basemap: basemapUrl, labelsUrl, basemapChangeControls
- Controls: navigationControls, geolocationControl, mapSearchControl
- Events: @load (map instance), @click, @move, @moveend, @zoom
- Default slot for custom layers, markers, controls
- Exposed ref: map instance, currentCenter, currentZoom, currentBounds

Apps add custom map content (markers, layers) through the `#map-content` slot on Pinboard, which renders inside PhilaMap's default slot.
