# Finder fidelity — icon chips, listing cards, panel alignment

**Date:** 2026-06-12
**Repo:** `pinboard-3`, branch `311-slice-f1-finder-fidelity` off `311-staging`
**Status:** Approved by Darren (design conversation 2026-06-12)
**Design source of truth:** Figma file `aRmWuYVwmG9S2gXdJxCjqL`, section **"Landing Page" 9789:30329**
(frame `9789:29821`). Darren confirmed this frame over the sibling section 9386:25443 — the
over-map search/chips row and the alerts bottom-sheet in 9386 are an OLDER iteration and are
**out of scope**. UX guidance (via Darren): follow the Pinboard framework where it makes things
simpler.

This is sub-slice **F1** of the fidelity/polish work (F2 = real Answers pages, F3 = a11y +
dedupe cleanup — separate specs later).

## Scope decisions (made with Darren, 2026-06-12)

1. **Icon filter chips** (in) — single horizontally-scrollable row in the panel, leading
   "All Filters" chip with a sliders icon acting as the show-everything filter, then the
   common-category chips with service icons; scroll-chevron affordance at the right end.
   The "All Filters" **expanded UI is deferred** — no Figma frame defines it; the chip is just
   the all-filter until UX designs one.
2. **Report-card fidelity** (in) — match the `.311 Report listing` component (node 9789:29931):
   photo thumbnail LEFT with the status tag overlaid top-left; service icon + bold type name;
   address; `10/10/26 · 10:41 AM` date line; distance bottom-right; service-color dot top-right.
3. **Panel header alignment** (in) — CTA label becomes **"Start a report"** (currently
   "Report an Issue"); panel order: title → description → CTA → chips → list.
4. **Address search stays** (Darren declined removal) — the Figma frame has no search box at
   all, so keeping Pinboard's built-in panel search (which renders between the header slot and
   the list) is an accepted deviation. Zero work.
5. **Trending articles UI removed, data layer kept** — Darren: Answers as a navbar item is the
   future direction; "cleanup the UI elements so it's not kruft (remove) but keep the data/api
   layer for it and document." Remove `TrendingArticles.vue` + test + landing usage (explicitly
   approved deletion); keep `useTrendingArticles` + `useKnowledgeArticles` composables and their
   tests; their ABOUTME headers describe them as the data layer for the Answers content section.
   `/answers/:id` route + `AnswerDetailPage` placeholder stay (F2 territory).
6. **Card mechanism: `location-card` slot in `@pinboard/ui`** (Darren chose this over a
   MapCard-props approximation — "less kruft over time"). A deliberate, scoped shared-package
   change.

## Component design

### 1. `@pinboard/ui`: `location-card` scoped slot

`packages/ui/src/components/LocationsPanel.vue` currently renders `MapCard` per location
(lines ~108-126), spread from `location.locationCardInfo`, inside a wrapper carrying
`data-location-id`, hovered/selected classes, tabindex, and click/hover/keyboard handlers.

Change: when the parent provides a `location-card` slot, render it **inside that same wrapper
element** in place of `MapCard`; otherwise render `MapCard` exactly as today. The wrapper (and
therefore ALL selection/hover/keyboard behavior, scroll-into-view via `data-location-id`, and
the hovered/selected classes) stays framework-owned regardless of card content. Slot props:
`{ location }` (the `BasicLocation`).

Mechanics: `MapCard` is currently the wrapper itself (the classes/handlers sit on the MapCard
element). Restructure to an outer `<div>` (or keep MapCard as-is in the no-slot branch and add
a parallel `<div>` branch carrying identical bindings — implementer's choice, but the bindings
must be identical in both branches and covered by tests). `PinboardBody.vue` forwards the slot
at **both** `LocationsPanel` render sites (desktop ~line 332, mobile ~line 443):

```vue
<template v-if="slots['location-card']" #location-card="scope">
  <slot name="location-card" v-bind="scope" />
</template>
```

(`useSlots()` is already imported in PinboardBody.)

**Test infrastructure:** `packages/ui` has NO tests today (no vitest, no test script). This
slice adds a minimal setup mirroring the app convention — `vitest` + `@vue/test-utils` dev-deps,
a `test`/`test:run` script, and `LocationsPanel.test.ts` covering: default MapCard rendering
(no slot), slot content rendering with `location` prop received, and wrapper behavior identical
in both branches (click emits `select`, hover emits `hover`, `data-location-id` present,
selected/hovered classes applied). Keep the setup minimal — no global mocks unless required.

**Primary-care-finder weather eye (Darren flagged this explicitly):**
`apps/primary-care-finder/frontend/src/App.vue:115` already passes a `#location-card` template
(rendering its own `LocationCard.vue`) that is **silently ignored today**. This change
activates it, altering that app's list rendering. Required verification, not optional: run
primary-care-finder's test suite (if it has one) and type-check, AND do a real render check
(dev server + browser) of its list before/after. If its `LocationCard` renders broken or
double-handles clicks, STOP and surface to Darren — do not ship a silent change to another
team's app. Findings (good or bad) go in the final report.

### 2. philly-311 `ReportListingCard.vue` (new, `components/`)

Rendered via the new slot. Receives `location` (BasicLocation); resolves the full `Report` via
`finder.reportById(location.id)` (passed as a prop — the component takes `report: Report` and
the landing page does the lookup, keeping the card dumb and testable).

Layout per node 9789:29931:
- Left: 72-80px photo thumbnail (`report.mediaUrl`), grey placeholder block with an image icon
  when absent; the status `Tag` (`@phila/phila-ui-tags`, `statusTagColor(report.status)`)
  overlaid top-left of the thumbnail. No status → no tag.
- Right/main: service-type icon (`serviceTypeIconDefinition(report.serviceType)`, colored
  `serviceTypeColor`) + bold service-type name; address line; date line `M/D/YY · h:mm AM`
  from `report.createdAt` (new `formatCardTimestamp` util next to `formatDistance`).
- Top-right: small service-color dot. Bottom-right: `formatDistance(report.distance)`.

`utils/reportCard.ts`: `reportToLocation` keeps producing `BasicLocation` (pins still need it)
but drops the now-unused `locationCardInfo`/`MapCardProps` shaping; `statusTagColor` stays
(used by the card). Existing tests updated accordingly (approved by this spec).

### 3. philly-311 `FilterChips.vue` (new, `components/`)

- Props: `options: {value, label}[]` (the existing `filterOptions` minus the old plain "All"),
  `modelValue: string`; emits `update:modelValue`.
- Renders one non-wrapping, `overflow-x: auto` row (scrollbar hidden): leading **"All Filters"**
  chip (FontAwesome sliders icon) with `value: 'all'`, then one chip per option with
  `serviceTypeIconDefinition(label)` + `serviceTypeColor(label)` icons — same icon source as
  the map pins. Selected chip gets a filled style; chips are `<button>`s with `aria-pressed`.
- Right edge: a chevron button (floating/sticky) that scrolls the row by ~80% of its visible
  width (`scrollBy({ left, behavior: 'smooth' })`). Hidden when the row doesn't overflow.
- Landing page wires `v-model` to `finder.filter` via `finder.setFilter`.

### 4. Landing page composition (`pages/LandingPage.vue`)

- `locations-header` slot: `ReportCallout` (CTA text → "Start a report"), then `FilterChips`.
- Remove the `:location-panel-filter` prop (built-in TagGroup chips disappear).
- Keep `:location-panel-search` + `@search` exactly as today.
- New `#location-card="{ location }"` template rendering `ReportListingCard` with the resolved
  report; if `reportById` misses (shouldn't happen), fall back to nothing — the wrapper still
  renders, and the card shows the BasicLocation name/address minimally (implementer keeps this
  trivial: render only when the report resolves, else plain name/address text).
- Remove `TrendingArticles` import/usage.

### 5. Deletions (approved)

- `components/TrendingArticles.vue` + `components/TrendingArticles.test.ts` + landing usage.
- The `locationCardInfo` shaping in `utils/reportCard.ts` (tests updated).
- KEEP: `useTrendingArticles.ts`, `useKnowledgeArticles.ts` + tests (Answers data layer).

## Testing

- TDD per component; existing conventions (vitest, @vue/test-utils, real Pinia where relevant).
- New `packages/ui` tests as above; `pnpm -r` type-check/lint across affected packages.
- philly-311: FilterChips (selection, aria-pressed, all-filters chip, chevron visibility logic —
  overflow itself can be unit-faked via mocked scrollWidth), ReportListingCard (all fields,
  placeholder photo, no-status, date format), LandingPage (slot/usage updates, trending gone).
- primary-care-finder: suite + type-check + manual render verification (see weather eye above).
- Live Playwright pass at 1440px on philly-311 landing: chips row renders with icons and
  scrolls, filter actually filters pins+list, cards match the design fields, callout label,
  trending strip gone. Known benign console error (`Unexpected token '<'`, Pictometry).

## Out of scope

All Filters expanded UI; over-map search/chips + alerts sheet (older design 9386:25443); navbar
changes; real Answers pages (F2); a11y/dedupe debt (F3 — icon-disc + pill-button dedupe live
there); address-search removal; mobile-specific fidelity beyond not breaking the existing
mobile layout.

## Merge

`finishing-a-development-branch` Option 1: `--no-ff` to `311-staging`, branch kept, nothing
pushed. The `@pinboard/ui` change rides the same branch/merge (monorepo workspace dep).
