# Primary Care Finder on pinboard-3

*2026-03-11*

## Overview

Recreate the existing primary-care-finder app as a pinboard-3 app (`apps/primary-care-finder`), using the `createPinboard` plugin from `packages/ui`. Straight port of functionality using the new framework's slot-based architecture.

## Framework Changes (packages/ui)

### New Location interface

```ts
interface Location {
  id: string
  [key: string]: unknown
}
```

Minimal contract. The framework only needs `id` for list keying, hover/selection tracking, and map marker cross-referencing. All domain data (coordinates, names, properties) is app-specific.

Apps define their own types that structurally satisfy this interface (e.g., `PrimaryCareLocation` has `id: string` plus domain fields). No explicit `extends` required — TypeScript structural typing handles it.

### New LocationsPanel.vue

Replaces per-app LocationList components. Lives in `packages/ui/src/components/`.

Responsibilities:
- Accepts `locations: Location[]` + interaction state (hoveredId, selectedId, onHover, onHoverEnd, onSelect)
- Iterates locations, wraps each in a `BaseCard` with hover styling, keyboard navigation (Enter key with keydown/keyup guard to prevent repeat-key triggers), click/hover handlers
- The entire card is the click target — LocationsPanel handles click and calls `onSelect` internally
- Renders a `#location-card` scoped slot for each item, passing `{ location, isHovered, isSelected }`
- `@phila/phila-ui-cards` becomes a dependency of `packages/ui` (moved from app-level)

### Slot change: #location-list → #location-card

The `#location-list` slot is removed. Apps now provide a `#location-card` scoped slot that renders content for a **single** location card. The framework handles the list, cards, and interaction behavior.

Scoped props: `{ location: Location, isHovered: boolean, isSelected: boolean }`

### FinderView.vue changes

- Imports and uses `LocationsPanel` instead of rendering `#location-list` slot directly
- Passes `loadedData` (which is now `Location[]`) and interaction state refs (hoveredId, selectedId, onHover, onHoverEnd, onSelect) as props to LocationsPanel
- Passes `#location-card` slot through from app to LocationsPanel

### State type change (breaking)

In `packages/ui/src/types.ts`, the `State` type changes from `{ kind: 'Loaded'; data: unknown }` to `{ kind: 'Loaded'; data: Location[] }`. This is a coordinated change — oem-flood-finder's `useLocations` composable must be updated in the same step to return `Location[]` instead of `LocationDTO`.

The `#map-content` slot also receives `locations` from FinderView. After this change, it receives `Location[]` instead of raw `unknown`. oem-flood-finder's map content slot code (which currently casts to `LocationDTO` and calls `allGauges()`) must be updated to iterate `Location[]` directly.

### oem-flood-finder migration

- Move `transformLocationDTO` from LocationList.vue into the useLocations composable
- Replace `#location-list` slot with `#location-card` slot (just renders card content for one location)
- Delete LocationList.vue

## App Structure

```
apps/primary-care-finder/frontend/
├── src/
│   ├── main.ts                    # createPinboard with config
│   ├── App.vue                    # Pinboard wrapper with slots
│   ├── types.ts                   # PrimaryCareLocation (extends Location)
│   ├── composables/
│   │   └── useLocations.ts        # Fetches ArcGIS, normalizes, filters
│   └── components/
│       ├── LocationCard.vue        # Card content for a single care center
│       ├── LocationDetail.vue      # Detail panel (hours, services, transit)
│       └── HomeContent.vue         # Landing page (intro, service overview)
├── i18n/
│   ├── index.ts                   # vue-i18n setup, English only for now
│   └── en.ts                      # English translations
├── index.html
├── vite.config.ts
├── package.json
└── .env.development
```

## Data Source

ArcGIS REST endpoint (same as original):
```
https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query?where=1=1&outFields=*&f=geojson
```

Returns GeoJSON FeatureCollection with properties for: record name, address, phone, services by age, specialties, wait times, tests, languages, transit, hours, sliding scale, warnings.

## Data Flow

1. `useLocations` fetches GeoJSON from ArcGIS endpoint
2. Maps each feature to `PrimaryCareLocation`: unique `id` from feature, properties spread as-is, geometry kept intact
3. **Hidden refinement** applied during normalization:
   - Exclude records where `data_complete` is falsy
   - Exclude test records
   - Exclude records with specific addresses (matching original logic)
4. Returns `Ref<State>` where loaded data is `PrimaryCareLocation[]`
5. Framework `FinderView` passes locations to `LocationsPanel`
6. `LocationsPanel` renders `#location-card` per item → app's `LocationCard` shows name, address, phone
7. On click → `#location-detail` → `LocationDetail` renders hours, services, transit
8. `#map-content` → app positions markers using geometry from each location

## i18n

- vue-i18n installed and configured
- All user-visible strings use `$t('key')` pattern
- Only `en.ts` populated initially
- Infrastructure ready for adding languages later

## Deferred

- **Filtering/refine UI** — SearchFilterPanel remains a stub
- **Non-English translations** — infrastructure only
- **Alerts/modals** — original had site closure warnings
- **Analytics** — GTM/Clarity
- **vue-good-table** — original used for service tables; use plain HTML tables for now
