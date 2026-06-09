# Philly 311 — Slice 2b: Landing Chrome (header CTA + trending + functional search)

- **Date:** 2026-06-09
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3`
- **Branch:** `feat/philly-311-landing-chrome` (off `311-staging`)

## Background

Slice 2a turned `/` into the `Pinboard` reports finder (map + list of nearby reports +
service-type filter chips + inline detail), merged into `311-staging`. This slice adds the
remaining **functional** landing chrome the Figma `Landing page` shows: the left-panel header
(report CTA + trending articles) and working **address search**. It combines the originally
separate 2b (header) and 2c (search) into one slice per the brainstorm.

Per the brainstorm, this slice delivers **function, not Figma-faithful placement**. The Figma
puts search in the navbar and filter chips over the map; stock `Pinboard` renders both in the
left panel. Matching the Figma's exact placement needs the same shared-`@pinboard/ui` work that
slice 2a.1 was deferred for — so faithful placement (navbar search, chips-over-map, the
"All Filters" multi-select panel) is bundled with 2a.1 **after Increment 3**. This slice uses
Pinboard's built-in panel search + the `locations-header` slot — no `@pinboard/ui` changes.

### Decisions (brainstorm)

| Decision | Choice |
| --- | --- |
| Scope | Functional now (CTA, trending, working search); faithful placement deferred to the fidelity slice with 2a.1 |
| Packaging | One combined slice (2b + 2c) |
| Search | Pinboard's built-in **panel** search, resolved via `useSearchAddress`/`useSearchZipcode`; resolved location recenters the map + reloads nearby reports |
| Report CTA target | A new minimal `/report` placeholder page (wizard replaces it in Increment 3) |
| Trending article links | In-app `/answers/:id` with a minimal placeholder page (real `AnswerDetailPage` ports later); the `url` field is a Salesforce slug, not an external link |
| "See all" / keyword search | Omitted this slice |

## Goals

- A `locations-header` block on `/`: "Report Issues Around You" heading + subtitle + a primary
  **"Report an Issue"** button routing to `/report`.
- A **Trending articles** strip (top-N knowledge articles) whose cards link to `/answers/:id`;
  hidden when empty or on fetch failure.
- Working **address/zipcode search** (Pinboard's panel search): a resolved location recenters the
  map and reloads nearby reports for it.
- Minimal placeholder pages + routes for `/report` and `/answers/:id` (CTA + card targets).
- Tests green; no `@pinboard/ui` or other-app changes; no regression to 2a.

## Non-goals (deferred)

- Figma-faithful placement: navbar search, chips-over-map, "All Filters" multi-select — bundled
  with slice 2a.1 after Increment 3.
- The real `AnswerDetailPage` (in-app article body) and `AnswersPage` list + "See all" — a later
  Answers slice.
- The report wizard (Increment 3) — `/report` is a placeholder this slice.
- Keyword search, list sort, the alert sheet.

## Architecture

### Report CTA + placeholder route

- **`components/ReportCallout.vue`** — heading + subtitle + primary "Report an Issue"
  `<router-link to="/report">` styled as a button (phila-ui button class, as the 2a placeholder
  used). One job: the report-callout header block.
- **`pages/ReportPage.vue`** — minimal placeholder ("Report a problem — coming soon"); the report
  wizard replaces it in Increment 3. **Route** `/report` added to `router/index.ts`. The existing
  `wizardGuard` only intercepts `/report/*` sub-paths and explicitly carves out `/report` itself
  (`if (to.path === '/report' || !to.path.startsWith('/report/')) return true`), so the placeholder
  at `/report` renders without redirect — no guard change needed.

### Trending articles

- **`composables/useTrendingArticles.ts`** — loads the top-N articles via the ported
  `useKnowledgeArticles().loadArticles({ pageSize: N })` (N≈5). Note `loadArticles` returns
  `{ items: Article[]; nextPageToken? }`, so `init()` unwraps `.items` into the exposed `articles`
  ref (plus `isLoading`, `error`). Failures resolve to an empty list (the strip hides).
  Knowledge-articles loads **anonymously** (verified — API-key only), so the strip works signed-out.
- **`components/TrendingArticles.vue`** — a horizontal strip of article cards; each card is a
  `<router-link :to="/answers/${article.id}">` showing the title. Renders nothing when the list is
  empty. (Card visual mirrors the Figma's small article cards; "See all" omitted.)

### Article placeholder route

- **`pages/AnswerDetailPage.vue`** — minimal placeholder ("Answer — coming soon", with the article
  id), replaced by the real in-app article page later. **Route** `/answers/:id` added.

### Address search → recenter + reload

Stock `Pinboard` owns the panel search box: bind `:location-panel-search="<placeholder>"` and
handle `@search`. A resolved location must (a) recenter the map and (b) reload nearby reports.

**Resolver: the ported `useAis`, not Pinboard's search composables.** Pinboard's
`useSearchAddress` fetches `import.meta.env.VITE_AIS_URL` and appends the query with **no
gatekeeper key** — it expects an app-specific AIS *proxy* (oem's was its own `0spy4bb9w1` proxy)
that philly-311 does not have. The ported `@/composables/useAis` already resolves addresses
correctly against philly's AIS using `VITE_AIS_BASE_URL` + the gatekeeper key (already in
`.env.*`), via a simple, already-tested async function:
`searchAddress(query): Promise<AisFeature | null>` where `AisFeature = { streetAddress, zipCode?,
lat, lng }`. AIS `/search/{query}` resolves addresses, intersections, and zips uniformly, so **no
classification regexes and no `useSearchAddress`/`useSearchZipcode` are needed**.

- **`useReportFinder` (additive change)** — gains `setCenter(loc: LatLon)`: sets
  `searchOrUserLocation` and reloads nearby reports for that center (reusing the existing load
  path). The 2a geolocation `init()` and `setFilter`/`reportById`/filter logic are unchanged; the
  composable still owns `searchOrUserLocation`. Additive — 2a tests are extended, not rewritten.
- **`pages/LandingPage.vue`** — binds `:location-panel-search="<placeholder>"` + `@search="onSearch"`,
  where `onSearch(query)` calls `searchAddress(query)` (from `@/composables/useAis`) and, on a
  non-null `AisFeature`, calls `finder.setCenter({ latitude: feature.lat, longitude: feature.lng })`
  (null → no-op, map holds). Also adds the `#locations-header` slot rendering `ReportCallout` +
  `TrendingArticles` and calls `useTrendingArticles().init()` on mount. The search wiring is small
  enough to live in the view (3 lines) and is covered by the LandingPage test (mock `searchAddress`).

> Ownership note: the finder remains the single source of the map center (`searchOrUserLocation`).
> `useAis.searchAddress` only resolves coordinates; we do NOT use `userUserAndSearchLocations`.

## Data flow

```
geolocation (2a init)  ─┐
search query → useAis.searchAddress(query) → AisFeature(lat,lng) ─┘→ finder.setCenter(loc)
  → searchOrUserLocation (recenter map) + useNearbyReports.load(region) (reload list + pins)

knowledge-articles top-N → useTrendingArticles → TrendingArticles cards → /answers/:id
```

## Error / empty handling

- Search resolves to nothing → `resolvedLocation` stays null → no recenter (map holds).
- Trending fetch fails or returns empty → `TrendingArticles` renders nothing (strip hidden).
- Reports loading/error continue through `Pinboard`'s `isLoading`/`errorMessage` as in 2a.

## Testing (TDD)

- **`useTrendingArticles.test.ts`** — top-N from a mocked `useKnowledgeArticles`; fetch error →
  empty list, no throw.
- **`TrendingArticles.test.ts`** — renders a card per article with a `/answers/:id` link; renders
  nothing when the list is empty.
- **`ReportCallout.test.ts`** — renders heading/CTA; the CTA links to `/report`.
- **`useReportFinder.test.ts` (extended)** — `setCenter` updates `searchOrUserLocation` and reloads
  for the new center; existing 2a cases stay green.
- **`LandingPage.test.ts` (extended)** — the `locations-header` slot renders ReportCallout +
  TrendingArticles; the `@search` handler calls `searchAddress` (mocked) and a resolved
  `AisFeature` triggers `finder.setCenter`; a `null` result is a no-op. (`@pinboard/ui` and
  `@/composables/useAis` stubbed locally; `searchAddress` is already unit-tested in `useAis.test.ts`.)
- **Placeholder pages** — `ReportPage` / `AnswerDetailPage` render their stub text (+ id).
- Router tests: `/report` and `/answers/:id` resolve to the placeholders.

## Risks / watch-items (resolve during planning)

1. **Search resolver = `useAis.searchAddress`** (not Pinboard's `useSearchAddress`, which needs an
   AIS proxy + `VITE_AIS_URL` philly-311 lacks). `searchAddress` is already wired to philly's AIS
   (`VITE_AIS_BASE_URL` + gatekeeper, already in `.env.*`) and already unit-tested. Confirm during
   planning that AIS `/search/{query}` resolves a bare zip and an intersection (it should — same
   endpoint); if a zip needs special handling, add it, but the address path is the primary case.
2. **Extending `useReportFinder` without regressing 2a.** `setCenter` reuses the existing load
   path; keep `init()`/filter/`reportById` behavior identical and update the test file additively.
3. **Article `url` is a slug, not a link.** Cards route to `/answers/:id` (the id), not `url`. The
   real external/in-app rendering is a later Answers slice.
4. **Trending count + layout.** N≈5; the strip is a simple horizontal scroller — pixel-faithful
   card styling is best-effort (MapCard/`@phila/phila-ui-cards` patterns), not a blocker.
5. **`@pinboard/ui` stub breadth.** `LandingPage.test.ts` keeps mocking `@pinboard/ui` locally;
   adding `ReportCallout`/`TrendingArticles` to the header slot must not require new global stubs.

## Definition of Done

1. `/` shows the report CTA + a trending-articles strip in the panel header.
2. CTA routes to a `/report` placeholder; trending cards route to `/answers/:id` placeholders.
3. Address/zipcode search recenters the map and reloads nearby reports for the resolved location.
4. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`.
5. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope / next

The fidelity slice (with 2a.1, after Increment 3): navbar search placement, chips-over-map,
"All Filters" panel. The real Answers pages + "See all". **Increment 3** = the report wizard
(replaces the `/report` placeholder). Increment 4 = CDK/deploy. The old
`311-mobile-app/web/webportal` stays until the redesign lands.
