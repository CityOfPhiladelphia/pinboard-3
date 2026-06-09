# Philly 311 — Increment 2 / Slice 2a: Core Reports Finder

- **Date:** 2026-06-09
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3`
- **Branch:** `feat/philly-311-reports-finder`

## Background

Increment 1 stood up `apps/philly-311` on the monorepo's conventions and ported the
framework-light foundation (data/types/utils/composables/store/router/auth) with tests
green; the app currently boots into a `PinboardShell` with a placeholder landing.

Increment 2 redesigns the landing into the **Pinboard map + list finder** the UX team
specified (Figma `Landing page`, node `9386:25443`): a 311-flavored version of the
`oem-flood-finder` / `primary-care-finder` experience built on the shared `@pinboard/ui`
`Pinboard` component. The full landing has several separable pieces (map+list of reports,
category filter chips, a left-panel header with a report CTA + trending articles, an AIS
header search, and an alert/inspector sheet).

This spec covers **Slice 2a — the core finder only**: the map + list of nearby reports,
single-select service-type filter chips, and an inline report-detail panel. It is fully
self-contained on the Increment-1 foundation, with no dependency on the deferred report
wizard or any new API. The other landing pieces are later slices.

### Slice roadmap (context, not scope)

- **2a — Core reports finder** ← this spec
- 2b — Left-panel header: "Report an Issue" CTA (targets the wizard, Increment 3) + trending articles
- 2c — AIS header search; Figma-faithful chip-over-map placement + "All Filters" panel
- 2d — Alert / inspector bottom sheet (pending a data-source decision; 311 has no Everbridge equivalent yet)

## Decisions already made (brainstorm)

| Decision | Choice |
| --- | --- |
| Slice scope | Core finder only (map + list + filter chips + inline detail) |
| Filter UX | Pinboard's built-in `location-panel-filter` — single-select chips in the left panel (not the Figma's chip-over-map placement, which is a later polish slice) |
| Filter source | The 10 `common_categories` (each a common service type), filtering by `serviceType` |
| Nearby region | Geolocate (fallback to a default Philly center) + **reload nearby reports on map pan** |
| Report detail | Inline summary in the `location-detail` slot; the full `/reports/:id` page stays deferred |
| Report CTA / header / search / alerts | Deferred to later slices |

## Goals

- `/` renders a working `Pinboard` finder: nearby 311 reports as map pins **and** a
  left-panel list of report cards, sourced from the ported `useNearbyReports`.
- Single-select service-type filter chips (the 10 `common_categories`) in the panel.
- Region seeded from geolocation (default Philly center fallback) and reloaded as the map pans.
- Marker / card click opens an inline `ReportDetail` in the `location-detail` slot.
- Finder logic lives in a unit-tested composable + pure mapping utils; the view is thin.
- Tests green; no regression to other apps; `@pinboard/ui` source not modified.

## Non-goals (later slices / increments)

- The left-panel header (report CTA + trending articles), AIS header search, the
  Figma-faithful chip-over-map placement, the "All Filters" multi-select panel, the
  alert/inspector sheet, the full `/reports/:id` detail page, and list sort controls.
- Any change to the shared `@pinboard/ui` package.
- The report wizard (Increment 3).

## Architecture

### Route & shape

`/` → `pages/LandingPage.vue` (replaces the placeholder) renders `<Pinboard>` (the
`PinboardBody` component exported as `Pinboard` from `@pinboard/ui`). All finder logic
lives in `useReportFinder`; the view only binds props/slots. This mirrors
`apps/oem-flood-finder/frontend/src/views/FinderView.vue`.

### Files (one responsibility each)

- **`composables/useReportFinder.ts`** — finder state. Owns `region` (seeded from
  `useGeolocation`, fallback default Philly center), the selected category filter, and the
  derived outputs the view binds: `locations: BasicLocation[]`, `searchOrUserLocation: LatLon`,
  `isLoading`, `errorMessage`. Loads via `useNearbyReports.load(region)`. Exposes handlers
  for filter change and for a **debounced region reload** (called on map `moveend`). Unit-tested
  with `useNearbyReports` / `useGeolocation` mocked.
- **`utils/reportCard.ts`** — pure `reportToLocation(report: Report): BasicLocation`. Builds
  `{ id, name, latitude, longitude, locationCardInfo }` where `locationCardInfo: MapCardProps`
  carries title (service type), subtitle (address), image (`mediaUrl`), a status tag, and the
  distance label. Unit-tested.
- **`utils/reportIcon.ts`** — pure `serviceTypeVisual(serviceType: string): { icon, color }`.
  Color from `serviceTypeMeta`; Fontawesome icon via the matching `common_categories.iconName`,
  with a neutral fallback for unmapped types. Unit-tested.
- **`components/ReportDetail.vue`** — the `location-detail` slot body: photo, status, service
  type, address, timestamp, description, close button. Mirrors oem's `LocationDetail.vue`.
- **`pages/LandingPage.vue`** — thin view. Binds `useReportFinder` to `<Pinboard>`; the
  `#map-content` slot renders a `MapMarker` + `MapIconTextPin` per report (icon/color from
  `reportIcon`) plus `MapNavigationControl` / `GeolocationButton` / `BasemapToggle`, and attaches
  `map.on('moveend', …)` to drive the debounced region reload; the `#location-detail` slot renders
  `ReportDetail`. Filter options come from `common_categories`.

### Data flow

```
geolocation / map center+bounds → region
  → useNearbyReports.load(region) → reports: Report[]
  → filter by selected service type (or all)
  → reports.map(reportToLocation) → BasicLocation[]
  → <Pinboard :locations> (panel list cards + pins via map-content)
  → marker/card click → location-detail slot → <ReportDetail>
```

### Filtering

`location-panel-filter` is built from `common_categories` →
`LocationFilterOption[] = [{ value: 'all', label: 'All' }, …{ value: <serviceType>, label }]`.
On `selectedLocationsFilter`, `useReportFinder` filters the loaded reports to the chosen
service type (`'all'` clears). Single-select — Pinboard's model. The "All Filters" multi-select
panel and chip-over-map placement are a later slice.

### Region & reload-on-pan

On mount, `useReportFinder` requests geolocation (`useGeolocation`); on success the region
centers there, otherwise a default Philly center (`[-75.1652, 39.9526]`). It loads nearby
reports for that region. In the view, the maplibre instance from the `map-content` slot gets a
`moveend` listener that reads `map.getCenter()` + `map.getBounds()`, derives `{ lat, lng, radius }`
(radius from the bounds via the ported `bounds`/`distance` utils), and calls a **debounced**
reload (≈300–500ms) so dragging doesn't spam the API. `searchOrUserLocation` is set to the
user/region center so Pinboard's distance affordances work.

### Report detail

`ReportDetail.vue` shows the report inline (photo or placeholder, status pill, service type +
icon, address, timestamp, description). No navigation to `/reports/:id` (that page is deferred);
if a "view full report" affordance is wanted later it slots in then.

### Error / empty / loading

Wired through `Pinboard`'s `isLoading` + `errorMessage` (from `useNearbyReports`/`useReportFinder`).
Empty results use Pinboard's built-in count label ("No locations match").

## Testing strategy (TDD)

- **Pure utils** — `reportCard.test.ts`, `reportIcon.test.ts`: exhaustive mapping/format tests
  (title/subtitle/image/tags/distance; icon+color incl. fallback).
- **`useReportFinder.test.ts`** — region seeding (geolocation success + fallback), load via mocked
  `useNearbyReports`, filter application, debounced pan-reload (fake timers), error propagation.
- **Component** — `ReportDetail.test.ts` (renders all fields, close); `LandingPage.test.ts` (light):
  add a `@pinboard/ui` stub to `__test__/setup.ts` so we assert `<Pinboard>` receives the mapped
  `locations` + filter options and the slots wire up, **without** booting maplibre.
- No mocked-behavior-only tests; logic is tested through the composable/utils, not the stub.

## New dependency

`@fortawesome/pro-solid-svg-icons` (the icon set the pins/cards/chips use, as in oem). Pulls the
fontawesome registry token (already validated in the environment). `MapMarker`,
`MapIconTextPin`, `MapNavigationControl`, `GeolocationButton`, `BasemapToggle` come from the
existing `@pinboard/ui` dep (re-exported map-core).

## Risks / watch-items (resolve during planning)

1. **Live `serviceType` string format (highest).** `nearby-issues` returns a `serviceType` string;
   the Figma card titles show short forms ("Pothole") while `serviceTypeMeta` / `common_categories`
   use full names ("Pothole Repair"). The filter match key and the color/icon lookup depend on this.
   **Resolve empirically**: curl the test endpoint
   (`/private/key/nearby-issues?lat=39.95&lng=-75.16`, key from `.env.test`, anonymous-ok) during
   planning and key the matching/normalization off real values. Fallback: case-insensitive /
   normalized matching with a neutral icon+color default (already the design).
2. **Exact `MapCardProps` fields.** Confirm the `@phila/phila-ui-cards` `MapCardProps` shape
   (title/subtitle/image/tags/detail) and where the distance label belongs; mirror oem's usage.
3. **Reload-on-pan via the slot's map instance.** Confirm the `map-content` slot's `map` exposes
   `getCenter()`/`getBounds()` + `on('moveend')` (maplibre) and that listeners are cleaned up on
   unmount. oem does not reload-on-pan, so this integration is new.
4. **`@pinboard/ui` test stub.** Stubbing `Pinboard` in `setup.ts` must not break the foundation
   tests already relying on that file; add narrowly.
5. **Icon system.** `serviceTypeMeta` carries Material-Symbol names (native parity) but the web
   pins/cards use Fontawesome; `reportIcon` bridges via `common_categories.iconName` + a fallback,
   so a per-service-type Fontawesome map is not required for this slice.

## Definition of Done

1. `/` renders the Pinboard finder: nearby reports as pins + panel list cards.
2. Single-select service-type filter chips filter both list and pins.
3. Region seeds from geolocation (default fallback) and reloads on map pan.
4. Marker/card click opens `ReportDetail` inline.
5. `pnpm --filter @pinboard/philly-311 test:run` green (new units + component tests);
   `type-check`, `build`, and `lint` clean.
6. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope / next

Slices 2b (header CTA + trending), 2c (AIS search + Figma-faithful chips), 2d (alert sheet); the
report wizard is Increment 3. The old `311-mobile-app/web/webportal` stays until the redesign lands.
