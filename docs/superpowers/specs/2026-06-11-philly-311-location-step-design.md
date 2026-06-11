# Philly 311 — Increment 3 / Slice 3c: Location Step

- **Date:** 2026-06-11
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3`
- **Branch:** `feat/philly-311-location` (off `311-staging`)

## Background

Slices 3a/3b delivered the wizard shell, the Image step, and the Issue type step. Step 3,
**Location**, is a placeholder that unconditionally enables Next. This slice replaces it with the
real step: search for an address (AIS autocomplete), or use browser geolocation, with a map that
shows the chosen point and lets the user refine it by dragging the pin.

The supporting logic is already ported and tested (Increment 1): `useAis`
(`autocompleteAddresses` / `searchAddress` / `reverseGeocode`), `useGeolocation.getCurrentPosition`,
`utils/bounds.isInPhilly`, `useMapBounds` (+ `PHILLY_MAP_BOUNDS`), and store
`setLocation(WizardLocation | null)` where `WizardLocation = {address, zipCode?, lat, lng}` — the
exact shape the submit payload consumes. The POC has working `LocationStep.vue`,
`AisAutocomplete.vue`, and `LocationMap.vue` (draggable `MapMarker` on a
`@phila/phila-ui-map-core` map) to port. The router's wizard guard can already seed
`store.location` from `?lat&lng` deep-link params (with `address: ''`).

Figma Location frames: 9789:30972 / 31288 / 31403 / 31493 in file `aRmWuYVwmG9S2gXdJxCjqL`.
All show a two-column layout — address controls left, map right.

## Decisions (brainstorm)

| Decision | Choice |
| --- | --- |
| Data shape | **Match the backend payload** (`address` string + `zipCode` + coords). The Figma 31403 structured address form (Street / Apt / City / State / Zip) is **deferred** to the fidelity slice — no payload field for apt/unit; city/state are constant for Philly 311. (Darren: scoped to Philadelphia, service bounds in place; will raise the form with UX.) |
| POC behaviors | All three carry over: "Use my current location", draggable-pin refine (drag → `reverseGeocode` → updated address), and Philly-bounds validation gating Next |
| Photo-EXIF location suggestion (frame 30972) | **Out** — no backend support today; deferred |
| Layout | Figma two-column: search + results + status left, persistent map right; stacks to one column on small screens like the rest of the wizard |
| Map before selection | Persistent map with a Philly city-center default view (no pin); pin appears once `store.location` is set |
| Architecture | Thin `LocationStep` + 2 children: `AddressSearch` (POC `AisAutocomplete` port, Figma-styled results) and `LocationMap` (POC port, extended with a no-location state) |
| Validity | `useWizardValidity(computed)`: `store.location` set AND `isInPhilly(lat, lng)` |

## Goals

- `/report/location` renders the real step inside the wizard shell: AIS address search with a
  Figma-style results list, "Use my current location", and a map with a draggable pin, gated
  correctly by `canAdvance`.
- A completed selection stores a full `WizardLocation` via `store.setLocation`.
- Tests green; no `@pinboard/ui` or other-app changes.

## Non-goals (later slices)

- Details / Review step content (3d–3e) — placeholders remain.
- "Possible location based on your photo" (EXIF) — no backend support.
- Structured address form (street/apt/city/state/zip) and Figma-faithful global chrome — fidelity
  slice.

## Architecture

### `pages/report/LocationStep.vue` (replaces the placeholder)

Thin orchestrator over the store. Two-column layout: left column is heading + `AddressSearch` +
"Use my current location" button + selected-address line + errors; right column is `LocationMap`.

- **AddressSearch `select(AisFeature)`** → `store.setLocation({address: streetAddress, zipCode,
  lat, lng})`; clears any error.
- **"Use my current location"** → `getCurrentPosition()`; null → geolocation error message;
  otherwise `reverseGeocode(lat, lng)`; null/throw → resolve-failure message; success → same
  `setLocation` path. Button shows "Locating…" and disables while in flight.
- **LocationMap `move({lat,lng})`** (pin dragged) → `reverseGeocode`; on success `setLocation`
  with the new feature; on failure/throw keep the new coords and the existing address
  (`setLocation({...store.location, lat, lng})`) — POC behavior.
- **LocationMap `outOfBounds`** → error "311 only handles requests in Philadelphia."
- **Selected-address line** when `store.location` is set: the address, falling back to
  "`lat`, `lng`" when address is empty (deep-link-seeded locations).

Validity: `useWizardValidity(computed(() => !!store.location &&
isInPhilly(store.location.lat, store.location.lng)))`. A deep-link-seeded in-bounds location is
valid (address may be empty — payload sends the empty string; acceptable, unchanged semantics).

### `components/wizard/AddressSearch.vue` (port of POC `AisAutocomplete`)

Debounced `autocompleteAddresses` via `useDebouncedSearch`; picking a result calls
`searchAddress(r.searchAddress)` and emits `select(feature)` (null result / throw → inline
"Couldn't resolve that address."). Restyled per Figma 31288/31493: search input with a
search-icon button; results as a bordered list — pin icon, address line, "Philadelphia, PA"
subtitle (the autocomplete API returns no per-candidate zip, so no zip in the subtitle — data
over Figma). After a pick, the input shows the resolved address and the list clears.

### `components/wizard/LocationMap.vue` (port of POC `LocationMap`)

Props change from required `lat`/`lng` to an optional `location: {lat, lng} | null`:

- **No location**: map renders at a Philly city-center default (City Hall, zoom ~12), no pin.
- **Location set**: draggable `MapMarker` at the point, map centered there (zoom ~16);
  `dragend` emits `move({lat,lng})`; a watcher emits `outOfBounds` when the point leaves
  `isInPhilly`.

Uses `@phila/phila-ui-map-core` `Map` + `MapMarker` (already mocked in the test setup) with
`useMapBounds` and the shared basemap source from `utils/mapTiles.ts`. Marker styling: default
marker is acceptable; reuse the finder's marker look only if it drops in cheaply.

### Data flow

```
type → autocompleteAddresses → results list ─pick→ searchAddress → AisFeature
                                                            └→ store.setLocation
geolocate → getCurrentPosition → reverseGeocode → AisFeature ─┘
pin drag  → move{lat,lng} → reverseGeocode → feature | coords-only fallback → setLocation
store.location → LocationMap pin + selected-address line
validity: location && isInPhilly → useWizardValidity → shell Next
```

## Error / empty handling

- Autocomplete/search failures → inline error under the input (POC behavior/copy).
- Geolocation denied/unavailable → "We couldn't access your location. Type an address instead."
- Geolocate reverse-geocode miss → "We couldn't resolve your location to an address."
- Pin dragged out of bounds (or deep-link seeds an out-of-bounds point) →
  "311 only handles requests in Philadelphia."; Next disabled until back in bounds.
- Pin-drag reverse-geocode failure → coords update, address retained (no error shown; the
  selected-address line keeps the prior address).

## Testing (TDD)

- **`AddressSearch.test.ts`** — port POC `AisAutocomplete` coverage: typing triggers debounced
  autocomplete; results render with address + "Philadelphia, PA" subtitle; pick resolves via
  `searchAddress` and emits `select`; null resolve → inline error; input reflects the resolved
  address and the list clears.
- **`LocationMap.test.ts`** — no-location state renders map without marker; location renders
  draggable marker; `dragend` emits `move`; out-of-bounds location emits `outOfBounds`
  (immediate watcher).
- **`LocationStep.test.ts`** — select writes a full `WizardLocation` to the store; canAdvance
  (via provided ref + `WIZARD_CAN_ADVANCE_KEY`) false with no location, true with an in-bounds
  one, false again when out-of-bounds (+ error message shown); use-my-location happy path,
  denied path, and resolve-failure path; pin `move` with reverse-geocode success updates address,
  with failure keeps address and updates coords; selected-address line falls back to coords for
  an empty address.
- `useAis` / `useGeolocation` are mocked in component tests (their own tests cover fetching);
  store is real Pinia.
- Slice ends with a real-browser Playwright smoke on the live dev server: search → pick a
  result → pin appears → Next enables → lands on `/report/details`; drag the pin → address
  updates. (Geolocation path exercised only if the browser context permits granting it.)

## Definition of Done

1. `/report/location` renders the two-column step per the Figma structure: search with results
   list, "Use my current location", persistent map with draggable pin.
2. Selecting an address (search, geolocate, or pin drag) writes a complete `WizardLocation`;
   Philly-bounds validation gates Next via `useWizardValidity`.
3. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`; turbo
   build/type-check/test green monorepo-wide; `@pinboard/ui` unchanged.
4. Playwright smoke passes on the live dev server.

## Out of scope / next

3d Details, 3e Review + submit + `/report/confirmation` (includes the known `store.submit()`
setup-scope `useApi` fix); then the deferred fidelity slice (structured address form, navbar
search, chips-over-map, "All Filters", 2a.1 reload-on-pan) and Increment 4 (CDK/deploy).
