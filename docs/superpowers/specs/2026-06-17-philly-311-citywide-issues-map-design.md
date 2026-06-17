# Philly 311 — City-wide Open-Issues Map: Progressive Load, Zoom Cap, Clustering

**Date:** 2026-06-17
**Status:** Approved (design)
**Repos:** `pinboard-3` (frontend) and `311-mobile-app/api` (backend) — work spans both.

## Overview

The reports finder currently loads issues from a radius-scoped, 200-capped
`nearby-issues` query, so the map only ever shows a sliver of the city. This
change makes the map show **all open issues across Philadelphia**, loaded
progressively (nearest first, instant first page, the rest streamed in the
background), held client-side, and collapsed into **count-badge clusters** as
the user zooms out. Zoom-out is **capped** so the user can't zoom past the
full bounds of Philadelphia, and panning is constrained to the city.

"Open" means `status != "Closed"` (matching the iOS app).

## Goals

- Map renders all open issues city-wide, not just a 1-mile radius.
- First paint is fast: the issues nearest the user appear immediately; the
  remainder fill in behind them without blocking interaction.
- Points cluster into count badges as the map zooms out, declustering on
  zoom-in (client-side, mirrors the iOS grid-cluster behavior).
- Zoom-out is capped to Philadelphia's bounds; panning is constrained to the
  city (`maxBounds`).
- Returning to the map re-uses cached data unless the open-issue set has
  changed (cheap count check) or the cache is stale (TTL backstop).

## Non-goals

- No server-side clustering or tiling.
- No viewport/pan-driven refetch — once loaded, pan and zoom are pure
  client-side re-clustering.
- No change to the issue detail route or submission flow.
- No delta/incremental sync of individual issues — staleness triggers a full
  reload (see Data Lifecycle).

## Current state & constraints

- **Only public map endpoint:** `GET /private/key/nearby-issues` — anonymous
  OK, geo search via `searchCases(lat, lng, radius, limit, contactId)`, ordered
  by `DISTANCE()`. Hard caps: `MAX_RADIUS = 1600` m, `MAX_LIMIT = 200`. No
  pagination cursor/offset.
- `GET /private/key/issues` is auth-only and returns the signed-in user's own
  cases — not usable for a city-wide map.
- SOQL `OFFSET` caps at 2000 rows, so offset pagination cannot page the whole
  city. **Keyset pagination is required.**
- Frontend renders one DOM marker (`MapMarker` + `MapIconTextPin`) per location
  via the `Pinboard` `#map-content` slot. The slot currently receives
  `map: null` (see `MapPanel.vue` `slotProps`) and a reactive `zoom`.
- `MapConfig` (`packages/ui/src/types.ts`) supports `minZoom`/`maxZoom` but
  **not** `maxBounds`.
- `PHILLY_BOUNDS` (api `constant.ts`): `lat 39.86–40.14`, `lon -75.28–-74.95`.

## Design

### 1. Backend — `nearby-issues`: city-wide mode + keyset pagination + count

*(in `311-mobile-app/api`, `apps/api/nearbyIssues.ts` + `shared/services/salesforce.ts`)*

Extend the existing route rather than add a new one.

**Query params (additive, backward compatible):**
- `radius` — relax so a city-wide load is possible. Either raise `MAX_RADIUS`
  to cover the city from any anchor (~35 km) or treat an explicit
  `radius=all` / omitted-with-`all=true` as "no radius bound, whole city".
  Existing small-radius callers keep working.
- `cursor` — opaque keyset cursor encoding the last row's `(distance, Id)`.
  Absent = first page.
- `limit` — page size (keep `MAX_LIMIT = 200`; default page size for the map
  loader TBD in plan, e.g. 200).
- `count` (boolean) — when set, return only `{ total }` (a `SELECT COUNT()` of
  open-in-Philly cases) and skip row fetching. Used for cheap staleness checks.

**Ordering & keyset:** order by `DISTANCE(geo, anchor) ASC, Id ASC`. The cursor
carries the last `(distance, Id)`; the next page's `WHERE` is
`DISTANCE(...) > :d OR (DISTANCE(...) = :d AND Id > :id)`. `Id` is the tie-break
so equal-distance rows can't be skipped or duplicated. This yields nearest-first
ordering **and** dodges the `OFFSET` 2000 ceiling.

**Response shape:**
```jsonc
{
  "issues": [ /* same Report fields as today: id, caseNumber, lat/lng,
                 serviceType, status, address, mediaUrl, createdAt, … */ ],
  "nextCursor": "…" | null,   // null when no more pages
  "total": 1234               // total open-in-Philly count (for staleness)
}
```
Keep the existing parent/child dedup (`toNearbyIssues`). Payload stays the
current `Report` shape — the list cards need address/time/status/thumbnail.

**Risk to size in the plan:** confirm Salesforce SOQL allows `DISTANCE()` in
both `ORDER BY` and `WHERE` with a cursor comparison, and that the dedup step
doesn't break keyset continuity (dedup must be deterministic w.r.t. the sort).
If `DISTANCE()`-keyset proves infeasible, fall back to keyset on
`CreatedDate, Id` (loses strict nearest-first ordering but still progressive).

### 2. Frontend — progressive eager load + Pinia cache

*(in `apps/philly-311/frontend`)*

**Store:** a Pinia store (e.g. `useOpenIssuesStore`) owns the canonical dataset
so it survives route navigation:
- `reports: Report[]`, `seed: LatLon`, `total: number | null`,
  `fetchedAt: number | null`, `isLoading`, `isStreaming`, `error`.

**Seed location:** geolocate the user (existing `getCurrentPosition`), fall back
to city center (`DEFAULT_CENTER`). The seed anchors the distance ordering and
the initial map center. The map still centers on the user.

**Progressive load:**
1. Fetch page 1 (anchor = seed, no cursor) → render immediately
   (`isLoading` → false once page 1 lands).
2. While `nextCursor`, loop fetching subsequent pages in the background,
   appending to `reports` and re-deriving filter options + clusters
   (`isStreaming` true during this). Stop when `nextCursor` is null.
3. A page fetch error mid-stream stops streaming, keeps what loaded, surfaces a
   non-blocking "couldn't load all issues" hint with retry — partial data is
   still useful.

`useReportFinder` is refactored to read from the store and seed the load; it no
longer gates on a radius. Filter chip options derive from the full set as it grows.

**Data lifecycle / reload on nav:** on map entry,
- empty cache → full progressive load.
- populated cache → if `now - fetchedAt > TTL` (~5–10 min) → reload; else issue
  a `count`-mode request; `total` unchanged → reuse cache; changed → reload.
- Caveat (accepted): a raw count misses net-zero churn (one opens + one
  closes). The TTL backstop bounds the staleness window.

### 3. Zoom cap + maxBounds

- `minZoom`: set in the Pinboard map config (`main.ts`) to the level where
  Philly's bounds fit. Computed from `PHILLY_BOUNDS`/viewport (~10; mobile a
  touch lower) — **final value tuned in-browser**. `MapConfig` already supports
  `minZoom`.
- `maxBounds`: `MapConfig` has no `maxBounds` field. Set it imperatively on the
  map instance once it's available (see §4's map-instance exposure):
  `map.setMaxBounds(PHILLY_BOUNDS + padding)`. Define a shared Philly-bounds
  constant in the frontend (mirrors the API's `PHILLY_BOUNDS`).

### 4. Clustering — supercluster, app-side

*(in `apps/philly-311/frontend`; one small additive `@pinboard/ui` change)*

- Add `supercluster` as a frontend dependency.
- **Expose the real map instance to the slot:** `MapPanel.vue` currently passes
  `map: null` in `slotProps`. Change it to the actual maplibre instance
  (`mapRef.value?.map`). This is additive and backward compatible — `oem-flood-finder`
  just receives a real map instead of `null`. Needed for `setMaxBounds` and
  cluster-expansion zoom.
- **Cluster derivation:** a `useClusters` composable builds a supercluster index
  from the store's points; on integer-zoom change (round `slotProps.zoom`),
  call `getClusters(worldBbox, zoom)` — all points are in Philly, so a wide
  bbox returns the Philly clusters. Re-index when the point set changes
  (during streaming).
- **Rendering** in the `#map-content` slot:
  - cluster feature → a `MapMarker` containing a count-badge component
    (`ClusterBadge` — circle sized/labelled by point count, styled to the
    Figma/iOS look).
  - single feature → the existing `MapIconTextPin` (unchanged look).
- **Cluster click** → `supercluster.getClusterExpansionZoom(id)` then
  `map.easeTo({ center, zoom })` via the exposed map instance.
- Pan never recomputes clusters (supercluster output is zoom-, not pan-,
  dependent); only integer-zoom changes and dataset growth do.

## Components & interfaces (what changes)

| Unit | Repo | Change |
|---|---|---|
| `nearbyIssues.ts` route | api | add `cursor`/`count`/relaxed `radius`; return `nextCursor` + `total` |
| `salesforce.searchCases` | api | keyset params (cursor), count query, relaxed radius |
| `useOpenIssuesStore` (new) | fe | canonical dataset + lifecycle |
| `useNearbyReports` / loader | fe | page-1 + background keyset paging |
| `useReportFinder` | fe | read store, seed load, drop radius gating |
| `useClusters` (new) | fe | supercluster index + clusters-at-zoom |
| `ClusterBadge` (new) | fe | count-badge marker content |
| `LandingPage.vue` map slot | fe | render clusters vs singles; cluster click |
| `MapPanel.vue` | `@pinboard/ui` | expose real map instance in `slotProps` |
| `main.ts` Pinboard config | fe | `minZoom`; `maxBounds` applied via map instance |

## Data flow

geolocation/seed → store load (page 1 → render; background keyset pages →
append) → `reports` + `total` cached → `useClusters` indexes points →
on zoom change, clusters/singles rendered as markers → cluster click eases map
to expansion zoom. Re-entry to map → count/TTL check → reuse or reload.

## Error handling

- Page 1 failure → existing error surface (`errorMessage`), retry.
- Background page failure → stop streaming, keep loaded points, non-blocking
  "partial results" hint + retry; clusters reflect what loaded.
- `count`-check failure → treat as stale and reload (fail safe toward fresh).
- Geolocation denied/unavailable → city-center seed (existing fallback).

## Testing strategy

- **Backend:** unit + e2e for keyset paging (cursor round-trips, no
  gaps/dupes across pages incl. equal-distance tie-break), `count` mode,
  city-wide radius, open-only filter.
- **Frontend:**
  - store paging loop (mocked multi-page responses → full set assembled;
    mid-stream error → partial + hint).
  - lifecycle (count unchanged → no refetch; changed → reload; TTL expiry →
    reload).
  - `useClusters` (points + zoom → expected cluster/single counts; decluster
    on zoom-in).
  - zoom-cap/maxBounds config presence.
  - browser verification: nearest-first fill, clustering visual, zoom floor,
    pan constraint, map controls intact.

## Sequencing

1. **Backend** keyset + count + city-wide mode (deploy to dev) — frontend
   depends on it.
2. **Frontend** store + progressive load against the new endpoint.
3. **Zoom cap + maxBounds.**
4. **Clustering** (supercluster + map-instance exposure + badges).

## Open risks

- SOQL `DISTANCE()` keyset feasibility (see §1 fallback to `CreatedDate, Id`).
- Total open-issue volume vs. background-load time and DOM/marker count at low
  zoom (supercluster keeps rendered markers low; verify in browser).
- `minZoom` exact value — tuned visually.
- Confirm `@phila/phila-ui-map-core` forwards `minZoom` from config to maplibre;
  if not, set it imperatively alongside `maxBounds`.
