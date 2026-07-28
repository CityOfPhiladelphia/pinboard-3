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

- **2a — Core reports finder (geolocate + load-once)** ← this spec
- 2a.1 — Reload-on-pan: reload nearby reports as the map moves. **Requires a small,
  deliberate `@pinboard/ui` enhancement** — the shared `MapPanel` currently hands `map: null`
  to the `map-content` slot, so the maplibre instance must be exposed there (via a ready
  event/ref) before an app can read `getCenter()`/`getBounds()`. Benefits oem/pc too.
- 2b — Left-panel header: "Report an Issue" CTA (targets the wizard, Increment 3) + trending articles
- 2c — AIS header search; Figma-faithful chip-over-map placement + "All Filters" panel
- 2d — Alert / inspector bottom sheet (pending a data-source decision; 311 has no Everbridge equivalent yet)

## Decisions already made (brainstorm)

| Decision | Choice |
| --- | --- |
| Slice scope | Core finder only (map + list + filter chips + inline detail) |
| Filter UX | Pinboard's built-in `location-panel-filter` — single-select chips in the left panel (not the Figma's chip-over-map placement, which is a later polish slice) |
| Filter source | The 10 `common_categories` (each a common service type), filtering by `serviceType` |
| Nearby region | Geolocate (fallback to a default Philly center) + **load once** for that region. Reload-on-pan is deferred to slice 2a.1 (needs the `@pinboard/ui` map-exposure enhancement). |
| Report detail | Inline summary in the `location-detail` slot; the full `/reports/:id` page stays deferred |
| Report CTA / header / search / alerts | Deferred to later slices |

## Goals

- `/` renders a working `Pinboard` finder: nearby 311 reports as map pins **and** a
  left-panel list of report cards, sourced from the ported `useNearbyReports`.
- Single-select service-type filter chips (the 10 `common_categories`) in the panel.
- Region seeded from geolocation (default Philly center fallback); nearby reports loaded once
  for that region (reload-on-pan is slice 2a.1).
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

- **`composables/useReportFinder.ts`** — finder state. On `init()`, seeds the region by calling
  the ported `getCurrentPosition(): Promise<{lat,lng}|null>` from `composables/useGeolocation`
  (fallback to a default Philly center) and loads once via `useNearbyReports.load(region)`. Owns
  the selected category filter and exposes the derived outputs the view binds:
  `locations: BasicLocation[]`, `searchOrUserLocation: LatLon`, `isLoading`, `errorMessage`,
  `setFilter`, and `reportById(id)`. Unit-tested with `useNearbyReports` / `getCurrentPosition`
  mocked. (The debounced reload-on-pan handler is slice 2a.1.)
- **`utils/reportCard.ts`** — pure `reportToLocation(report: Report): BasicLocation`. Builds
  `{ id, name, latitude, longitude, locationCardInfo }` where `locationCardInfo: MapCardProps`
  uses the real `MapCardProps` fields: `heading` (service type), `subheader` (address — the
  distance label, via `formatDistance` from the ported `distance.ts`, goes here or as a tag),
  `src` (`mediaUrl`), optional `body`, and `tags: TagsProps[]` (the status pill, e.g.
  "In Progress"). Unit-tested. (Mirror oem's `useLocations` `MapCardProps` construction.)
- **`utils/reportIcon.ts`** — pure `serviceTypeVisual(serviceType: string): { icon, color }`.
  Color from `serviceTypeMeta`; the Fontawesome **icon object** resolved from the matching
  `common_categories.iconName` *string* via a small static import map (the `iconName` values
  like `"road"`/`"dumpster"` are FA name strings, not icon objects, so `MapIconTextPin` needs
  the resolved `IconDefinition`). Neutral fallback for unmapped types. Unit-tested.
- **`components/ReportDetail.vue`** — the `location-detail` slot body: photo, status, service
  type, address, timestamp, description, close button. Mirrors oem's `LocationDetail.vue`.
- **`pages/LandingPage.vue`** — thin view. Binds `useReportFinder` to `<Pinboard>`; the
  `#map-content` slot renders a `MapMarker` + `MapIconTextPin` per report (icon from
  `reportIcon`) plus `MapNavigationControl` / `GeolocationButton` / `BasemapToggle`; the
  `#location-detail` slot looks up the full report via `reportById(location.id)` and renders
  `ReportDetail`. Filter options come from `common_categories`. (No map-instance access / pan
  listener — that's slice 2a.1.)

### Data flow

```
geolocation (or default Philly center) → region (loaded once)
  → useNearbyReports.load(region) → reports: Report[]
  → filter by selected service type (or all)
  → reports.map(reportToLocation) → BasicLocation[]
  → <Pinboard :locations> (panel list cards + pins via map-content)
  → marker/card click → location-detail slot → <ReportDetail>
```

### Filtering

`location-panel-filter` is built from `common_categories` →
`LocationFilterOption[] = [{ value: 'all', label: 'All' }, …{ value: <category.title>, label: category.title }]`.
On `selectedLocationsFilter`, `useReportFinder` filters the loaded reports to those whose
`serviceType` matches the chosen category's title (`'all'` clears). The match keys off the
**full data display name** (`common_categories.title`, which equals the `serviceType` /
`serviceTypeMeta` key, e.g. "Pothole Repair") — per the data-over-Figma decision below, the
Figma's short chip labels ("Pothole") are design hand-waving and are not used. Single-select —
Pinboard's model. The "All Filters" multi-select panel and chip-over-map placement are a later
slice.

### Region (load-once)

On `init()` (called from the view's `onMounted`), `useReportFinder` calls `getCurrentPosition()`;
on a non-null result the region centers there, otherwise a default Philly center
(`{ lat: 39.9526, lng: -75.1652 }`). It loads nearby reports once for that region (default radius
~1600m) via `useNearbyReports.load`. `searchOrUserLocation` is set to that center so Pinboard's
distance affordances work. The `GeolocationButton` in the map slot can re-center; a full
reload-as-you-pan flow is slice 2a.1 (it needs the `@pinboard/ui` enhancement to expose the map
instance in the `map-content` slot, which today is `null`).

### Report detail

`ReportDetail.vue` shows the report inline (photo or placeholder, status pill, service type +
icon, address, timestamp, description). No navigation to `/reports/:id` (that page is deferred);
if a "view full report" affordance is wanted later it slots in then.

### Error / empty / loading

Wired through `Pinboard`'s `isLoading` + `errorMessage` (from `useNearbyReports`/`useReportFinder`).
Empty results use Pinboard's built-in count label ("No locations match").

## Testing strategy (TDD)

- **Pure utils** — `reportCard.test.ts`, `reportIcon.test.ts`: exhaustive mapping/format tests
  (heading/subheader/src/tags/distance; icon incl. fallback).
- **`useReportFinder.test.ts`** — region seeding (`getCurrentPosition` success + null fallback),
  load via mocked `useNearbyReports`, filter application, `reportById` lookup, error propagation.
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

1. **Live `serviceType` string format (resolved — data over Figma).** Decision: trust the data,
   not the Figma. The API's `serviceType` is assumed to be the **full display name** matching our
   `service_types.json` keys / `serviceTypeMeta` keys / `common_categories.title` (e.g.
   "Pothole Repair"); the Figma's short labels ("Pothole") are hand-waved design copy and are not
   used. Filter-matching, card `heading`, and icon/color all key off that full name, with a
   neutral icon+color fallback for any unmapped value. The plan should still curl the test endpoint
   (`/private/key/nearby-issues?lat=39.95&lng=-75.16`, key from `.env.test`, anonymous-ok) once as
   a sanity check, but builds on the data-name assumption.
2. **`MapCardProps` fields (resolved).** The real fields are `heading`, `subheader`, `src`,
   `body`, and `tags: TagsProps[]` (not title/subtitle/image). `reportToLocation` maps to these;
   the distance label lives in `subheader` or as a tag. Mirror oem's `useLocations` usage.
3. **`@pinboard/ui` test stub.** `LandingPage.test.ts` mocks `@pinboard/ui` **locally** (a
   `vi.mock` at the top of the test) rather than editing the global `__test__/setup.ts`, so it
   can't break the foundation tests. The local stub renders the slots and exposes the bound props.
4. **Icon system.** `serviceTypeMeta` carries Material-Symbol names (native parity) but the web
   pins use Fontawesome; `reportIcon` bridges via `common_categories.iconName` + a fallback, so a
   per-service-type Fontawesome map is not required for this slice. `MapIconTextPin` uses a
   `color-theme` enum (not hex), so pins use a constant brand theme; status differentiation lives
   in the card's status tag.
5. **Map instance not in the slot (deferred).** `MapPanel` hands `map: null` to `map-content`;
   reload-on-pan (slice 2a.1) will expose it via a small `@pinboard/ui` enhancement. Slice 2a does
   not touch the map instance.

## Definition of Done

1. `/` renders the Pinboard finder: nearby reports as pins + panel list cards.
2. Single-select service-type filter chips filter both list and pins.
3. Region seeds from geolocation (default fallback) and loads once.
4. Marker/card click opens `ReportDetail` inline.
5. `pnpm --filter @pinboard/philly-311 test:run` green (new units + component tests);
   `type-check`, `build`, and `lint` clean.
6. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope / next

Slice 2a.1 (reload-on-pan + the `@pinboard/ui` map-exposure enhancement), 2b (header CTA +
trending), 2c (AIS search + Figma-faithful chips), 2d (alert sheet); the report wizard is
Increment 3. The old `311-mobile-app/web/webportal` stays until the redesign lands.
