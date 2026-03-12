# OEM Flood Finder: Location Type Tabs

## Problem

The flood monitoring API returns three location types (awareGauges, usgsGauges, cameras) but the app shows them all in one flat list. Gauges and cameras serve different purposes and should be viewable separately. Cameras should render as icon-only red pins on the map, while gauges keep their current appearance.

## Design

### Approach

Module-level mode ref in `useLocations.ts`. The composable fetches all data once, filters reactively based on mode. Pinboard sees only the active category. A new `#locations-header` slot in Pinboard.vue allows the app to render tabs above the location list.

### Changes

#### 1. Pinboard.vue (packages/ui)

Add a `#locations-header` slot inside `.finder-panel-locations`, rendered when `finderActive` is true, before SearchFilterPanel. The slot renders unconditionally within the `finderActive` block (it doesn't depend on data being loaded).

Add the slot to `defineSlots` type:
```typescript
'locations-header'?(props: {}): unknown
```

Template placement:
```html
<template v-if="finderActive">
  <slot name="locations-header" />         <!-- NEW -->
  <SearchFilterPanel v-if="loadedData" ... />
  <!-- loading/error/LocationsPanel as before -->
</template>
```

#### 2. useLocations.ts (oem-flood-finder)

- `locationMode` is a **module-level** `Ref<'gauges' | 'cameras'>` (default `'gauges'`), exported as a **separate named export** — NOT returned from the composable function. App.vue imports it directly: `import { locationMode } from './composables/useLocations'`
- The `useLocations()` function still returns `Ref<State>` (satisfying `PinboardConfig.useLocations`), but internally:
  - Fetches all data once into an internal `allLocations` ref (via `onMounted`, same as today)
  - Returns a `computed` ref wrapping a `State` that filters `allLocations` based on `locationMode`:
    - `'gauges'` mode: locations where `other.kind` is `'AwareGauge'` or `'UsgsGauge'`
    - `'cameras'` mode: locations where `other.kind` is `'Camera'`
- The computed re-evaluates when `locationMode` changes, which triggers Pinboard's downstream computeds (`loadedData`, `loadedGeojson`) to update reactively

#### 3. App.vue (oem-flood-finder)

- Import `faCamera` from `@fortawesome/free-solid-svg-icons`
- Import `locationMode` from `./composables/useLocations`
- In `#locations-header` slot: render two `<button>` elements ("Gauges" / "Cameras") with `role="tablist"` / `role="tab"` and `aria-selected`. Active tab gets a visual indicator (bottom border). Toggle `locationMode` on click.
- In `#map-content` slot: since locations are already filtered, check `locationMode` to decide pin appearance:
  - `'gauges'`: `faGauge` icon, `:text="loc.id.slice(0, 8)"`, `color-theme="dark-primary"`
  - `'cameras'`: `faCamera` icon, no `text` prop (icon-only), `color-theme="dark-error"`
- Clear `selectedLocation` when switching tabs (so the detail panel doesn't show stale data from the other category). This requires Pinboard to either expose a way to clear selection, or the mode switch should close the detail panel. Simplest: switching tabs sets `locationMode` and Pinboard naturally won't find the selected location in the new filtered list — the detail panel will show stale data unless we handle it. **Solution**: Pinboard should watch `loadedData` and clear `selectedLocation` if the selected location's ID is no longer in the list.

#### 4. Pinboard.vue — clear stale selection

Add a `watch` on `loadedData`: if `selectedLocation` is set and its ID is not found in the new `loadedData`, clear `selectedLocation` to `null`. This handles tab switching and any future case where the data changes underneath a selection.

#### 5. LocationDetail.vue (oem-flood-finder)

`useLocationDetail` fetches gauge readings via `/aware/reading/{gaugeId}` — this will fail for camera IDs. Guard the reading fetch:
- Only call `useLocationDetail` when `location.other.kind` is `'AwareGauge'` or `'UsgsGauge'`
- For cameras, show camera-specific info instead (name, `pageUrl` link to the camera feed)

### What doesn't change

- The `Location` type and `LocationDTO` type
- The `transformLocationDTO` function
- The `createPinboard` plugin API
- LocationsPanel

### Tab styling

Two `<button>` elements in a flex row. Active tab: bold text + 2px bottom border in the app's primary color. Inactive tab: no border, normal weight. Minimal scoped CSS in App.vue.

### Verification

- Switch to Gauges tab: list shows only gauge locations, map shows `faGauge` pins with text
- Switch to Cameras tab: list shows only camera locations, map shows red `faCamera` icon-only pins
- Click a gauge card: detail panel shows readings table
- Click a camera card: detail panel shows camera name and link
- Switch tabs while detail is open: detail panel closes
- Default tab on load is Gauges

### Dependency note

`MapIconTextPin` (from `@phila/phila-ui-map-core`) supports icon-only mode by omitting the `text` prop. This was verified by reading the component source — it conditionally renders text with `v-if="text"` and applies an `icon-only` CSS class.
