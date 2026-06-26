# Primary Care Finder — Filter System

*Date: 2026-06-02*
*Branch: `feat/primary-care-changes`*
*Figma: https://www.figma.com/design/DNNvMuFDut7sJ7boqzrIwl/Primary-Care-finder?node-id=37-22052*

## Goal

Reimplement the Primary Care Finder filter chips to match the Figma design: a
chip row (leading filter button + dropdown chips per dimension) plus an "All
Filters" accordion panel. The filter **UI and state** are in scope. The actual
**data filtering** (mapping selections to `PrimaryCareProperties`) is left as a
documented seam for a teammate.

## Scope decisions

- **Full filter-system UI**, data wiring stubbed (teammate completes it).
- **Shared in `packages/ui`**, opt-in per app. Apps opt out by passing no
  `filters` (OEM stays as-is — too simple to need this).
- **Chip row = all dimensions** (drag-scroll), not just a "popular" subset.
- **Mobile = package-default rendering** this pass (no custom Figma full-sheets).
  Chip-bar mobile placement is teleport-driven and configurable.

## Architecture

The per-chip dropdowns, the `filterButton` (sliders icon + active count), and
the `FilterDefinition`/`FilterValues` types already ship in
`@phila/phila-ui-filter-chip`. The custom work is the **All Filters** panel and
the `PinboardBody` integration.

### New components (`packages/ui/src/components/`)

- **`FilterChipBar.vue`** — thin wrapper over `<FilterChipGroup>`:
  - `filterButton` enabled (leading sliders + active-selection count).
  - One dropdown chip per `FilterDefinition` (drag-scroll row).
  - Per-chip dropdowns (radio/checkbox + Reset/Apply) handled by the package.
  - Emits `open-filters`; binds `v-model` to the shared `filterValues`.

- **`AllFiltersPanel.vue`** — the accordion mega-panel opened by the filter
  button:
  - Search box, one collapsible section per `FilterDefinition`, Reset / Apply(n).
  - Checkbox group (`multiple: true`) or radio group (`multiple: false`) per
    section, reusing phila-ui Checkbox/Radio.
  - Binds to the same `filterValues`.

### `PinboardBody.vue` changes

- New prop `filters?: FilterDefinition[]` and `v-model:filterValues`
  (`filterValues` prop + `update:filterValues` emit).
- When `filters` is present, render `FilterChipBar` in the locations-panel header
  (desktop) and host `AllFiltersPanel`. Absent ⇒ render nothing new (opt out).
- Re-export `FilterDefinition`, `FilterValues`, `FilterChoice` from `@pinboard/ui`.
- The existing `locationPanelFilter` / `LocationSearchFilterPanel` / sort plumbing
  is left untouched (separate, older mechanism still used elsewhere).

### Mobile placement (teleport seam)

- `FilterChipBar` renders once; on mobile it's wrapped in `<Teleport :to="…">`.
- `PinboardBody` provides two target mounts:
  1. under the mobile search box on the map (`.mobile-map-search-filter`) —
     **Figma default**
  2. top of the bottom-sheet list (`.bottom-sheet-list-scroll`)
- Prop `mobileFilterPlacement: 'map' | 'sheet'` selects the target
  (default `'map'`). Mirrors the existing `mobileControlsTarget` teleport pattern.

### Dependencies

- Add `@phila/phila-ui-filter-chip` to `packages/ui/package.json`.
- The app keeps `@fortawesome/pro-solid-svg-icons` (chip icon definitions live in
  the app's `filterDefinitions`).

## App config (`primary-care-finder`)

Replace the `#locations-header` `FilterChipGroup` usage with:

```
<PinboardBody :filters="filterDefinitions" v-model:filter-values="filterValues" … />
```

`filterDefinitions: FilterDefinition[]` (PCF-specific) covering:

| key            | label                      | mode      | choices |
|----------------|----------------------------|-----------|---------|
| `sort`         | Sort                       | radio, `excludeFromCount` | **placeholder** — flagged for teammate |
| `ageGroup`     | Age Group                  | checkbox  | Adult, Children |
| `waitTime`     | Wait time (Primary Care)   | checkbox  | Same day or walk in; <1 week (well visit); <1 week (sick visit); <2 months (all primary care) |
| `speciality`   | Speciality services        | checkbox  | Mental health, Dental, Eye care, Podiatry, MAT, Nutrition, Tobacco cessation, Pharmacy |
| `tests`        | Tests and imaging          | checkbox  | Blood, STI, COVID, Mammography, X-ray |
| `languages`    | Languages spoken by staff  | checkbox  | **placeholder** — flagged for teammate (`language` field values unknown) |

## Data seam (teammate work)

The app gets an `applyFilters(locations, filterValues)` function that currently
**returns locations unfiltered**, with a clearly-marked TODO and per-dimension
stubs:

```ts
// TODO(teammate): map filterValues → PrimaryCareProperties predicates.
// Field hints:
//   ageGroup   → *_ad / *_ch suffixed fields
//   waitTime   → wait_* fields
//   speciality → special_* fields
//   tests      → tests_* fields
//   languages  → language field
//   sort       → ordering (not a predicate); apply after filtering
```

Free-text search (`searchString`) keeps working as today. Only the dimension
predicates and sort ordering are stubbed.

## What works end-to-end after this pass

Chips, per-chip dropdowns, active counts, the All Filters panel (search,
accordion, Reset/Apply), `filterValues` state, mobile teleport placement, and the
opt-in/opt-out boundary. The only missing piece is the predicate mapping.

## Out of scope

- Data/predicate wiring (teammate).
- Custom Figma mobile full-sheet treatment (likely belongs in the package later).
- OEM adoption.
- Finalizing Sort options and the Languages list (depend on data work).
